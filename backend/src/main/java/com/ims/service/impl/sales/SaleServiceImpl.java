package com.ims.service.impl.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.sales.*;
import com.ims.entity.broker.*;
import com.ims.entity.costing.ShopExpenseEntity;
import com.ims.entity.finance.EmiScheduleEntity;
import com.ims.entity.finance.FinanceDetailEntity;
import com.ims.entity.sales.*;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.workshop.JobCardEntity;
import com.ims.enums.*;
import com.ims.exception.*;
import com.ims.repository.broker.*;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.finance.EmiScheduleRepository;
import com.ims.repository.finance.FinanceDetailRepository;
import com.ims.repository.sales.*;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.serviceInterface.sales.SaleService;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final FinanceDetailRepository financeDetailRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final BrokerVehicleListingRepository brokerListingRepository;
    private final BrokerCommissionRepository brokerCommissionRepository;
    private final BrokerSettlementRepository brokerSettlementRepository;
    private final JobCardRepository jobCardRepository;
    private final ShopExpenseRepository shopExpenseRepository;
    private final StatusWorkflowService statusWorkflowService;

    @Override
    @Transactional
    public SaleResponse confirmSale(SaleCreateRequest request, String username) {
        CustomerEntity customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        // Pessimistic write lock on vehicle to prevent concurrent double sale
        VehicleEntity vehicle = vehicleRepository.findByIdForUpdate(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        if (vehicle.getStatus() == VehicleStatus.SOLD || vehicle.getStatus() == VehicleStatus.DELIVERED) {
            throw new BusinessRuleViolationException("Vehicle [" + vehicle.getRegistrationNumber() + "] has already been sold");
        }

        if (saleRepository.findByVehicleId(vehicle.getId()).isPresent()) {
            throw new DuplicateResourceException("A sale record already exists for vehicle [" + vehicle.getRegistrationNumber() + "]");
        }

        // Validate booking if applicable
        BookingEntity booking = null;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", request.getBookingId()));

            if (booking.getStatus() != BookingStatus.BOOKED) {
                throw new BusinessRuleViolationException("Booking is not in active BOOKED status");
            }
            if (!booking.getVehicle().getId().equals(vehicle.getId())) {
                throw new BusinessRuleViolationException("Booking does not belong to this vehicle");
            }
        } else if (vehicle.getStatus() == VehicleStatus.BOOKED) {
            // Check if booked by another customer
            List<BookingEntity> activeBookings = bookingRepository.findByVehicleIdAndStatus(vehicle.getId(), BookingStatus.BOOKED);
            if (!activeBookings.isEmpty() && !activeBookings.get(0).getCustomer().getId().equals(customer.getId())) {
                throw new BusinessRuleViolationException("Vehicle is currently booked by customer: " + activeBookings.get(0).getCustomer().getName());
            }
            if (!activeBookings.isEmpty()) {
                booking = activeBookings.get(0);
            }
        }

        String saleNumber = "SALE-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalSalePrice = request.getAgreedPrice().subtract(discount);

        SaleEntity sale = SaleEntity.builder()
                .saleNumber(saleNumber)
                .customer(customer)
                .vehicle(vehicle)
                .saleDate(request.getSaleDate())
                .saleType(request.getSaleType())
                .agreedPrice(request.getAgreedPrice())
                .discountAmount(discount)
                .finalSalePrice(finalSalePrice)
                .status(SaleStatus.IN_PROGRESS)
                .notes(request.getNotes())
                .build();

        SaleEntity savedSale = saleRepository.save(sale);
        BigDecimal totalPaid = BigDecimal.ZERO;

        // 1. Process booking advance payment conversion
        if (booking != null) {
            booking.setStatus(BookingStatus.CONVERTED_TO_SALE);
            bookingRepository.save(booking);

            String receiptNo = "REC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            PaymentEntity advancePayment = PaymentEntity.builder()
                    .receiptNumber(receiptNo)
                    .sale(savedSale)
                    .paymentDate(request.getSaleDate())
                    .amount(booking.getAdvanceAmount())
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .transactionReference("Advance from Booking: " + booking.getBookingNumber())
                    .notes("Converted booking advance")
                    .idempotencyKey("BKG-ADV-" + booking.getId())
                    .build();

            paymentRepository.save(advancePayment);
            savedSale.getPayments().add(advancePayment);
            totalPaid = totalPaid.add(booking.getAdvanceAmount());
        }

        // 1b. Process initial upfront payment for DIRECT sales if provided
        if (request.getSaleType() == SaleType.DIRECT && request.getInitialPayment() != null && request.getInitialPayment().compareTo(BigDecimal.ZERO) > 0) {
            String receiptNo = "REC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            PaymentMethod method = request.getPaymentMode() != null ? request.getPaymentMode() : PaymentMethod.BANK_TRANSFER;
            String ref = request.getPaymentReference() != null ? request.getPaymentReference() : "Upfront sale settlement";

            PaymentEntity initialPay = PaymentEntity.builder()
                    .receiptNumber(receiptNo)
                    .sale(savedSale)
                    .paymentDate(request.getSaleDate())
                    .amount(request.getInitialPayment())
                    .paymentMethod(method)
                    .transactionReference(ref)
                    .notes("Upfront sale receipt")
                    .idempotencyKey("SALE-INIT-" + savedSale.getId())
                    .build();

            paymentRepository.save(initialPay);
            savedSale.getPayments().add(initialPay);
            totalPaid = totalPaid.add(request.getInitialPayment());
        }

        // 2. Process Finance Arrangement if FINANCE sale
        if (request.getSaleType() == SaleType.FINANCE) {
            if (request.getFinanceCompany() == null || request.getLoanAmount() == null || request.getTenureMonths() == null) {
                throw new BusinessRuleViolationException("Finance company, loan amount and tenure are required for Finance sales");
            }

            BigDecimal downPayment = request.getDownPayment() != null ? request.getDownPayment() : BigDecimal.ZERO;
            BigDecimal emiAmount = request.getEmiAmount();
            BigDecimal interestRate = request.getInterestRate() != null ? request.getInterestRate() : BigDecimal.valueOf(9.5);

            if (emiAmount == null || emiAmount.compareTo(BigDecimal.ZERO) <= 0) {
                // Calculate monthly EMI using standard formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
                double p = request.getLoanAmount().doubleValue();
                double monthlyRate = (interestRate.doubleValue() / 100.0) / 12.0;
                int n = request.getTenureMonths();
                double emiVal = (monthlyRate > 0)
                        ? (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
                        : (p / n);
                emiAmount = BigDecimal.valueOf(emiVal).setScale(2, RoundingMode.HALF_UP);
            }

            String finType = request.getFinanceType() != null && !request.getFinanceType().isBlank()
                    ? request.getFinanceType()
                    : "IN_HOUSE";

            FinanceDetailEntity financeDetail = FinanceDetailEntity.builder()
                    .sale(savedSale)
                    .financeCompany(request.getFinanceCompany())
                    .loanAccountNumber(request.getLoanAccountNumber())
                    .loanAmount(request.getLoanAmount())
                    .downPayment(downPayment)
                    .interestRate(interestRate)
                    .tenureMonths(request.getTenureMonths())
                    .emiAmount(emiAmount)
                    .emiDueDay(request.getEmiDueDay() != null ? request.getEmiDueDay() : 5)
                    .loanStartDate(request.getLoanStartDate() != null ? request.getLoanStartDate() : request.getSaleDate())
                    .loanEndDate(request.getLoanEndDate() != null ? request.getLoanEndDate() : request.getSaleDate().plusMonths(request.getTenureMonths()))
                    .status(FinanceStatus.ACTIVE)
                    .financeType(finType)
                    .lenderId(request.getLenderId())
                    .principalOutstanding(request.getLoanAmount())
                    .build();

            FinanceDetailEntity savedFinance = financeDetailRepository.save(financeDetail);
            savedSale.setFinanceDetail(savedFinance);

            // Record down payment if paid
            if (downPayment.compareTo(BigDecimal.ZERO) > 0) {
                String downPayReceipt = "REC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                PaymentEntity downPaymentEntry = PaymentEntity.builder()
                        .receiptNumber(downPayReceipt)
                        .sale(savedSale)
                        .paymentDate(request.getSaleDate())
                        .amount(downPayment)
                        .paymentMethod(PaymentMethod.BANK_TRANSFER)
                        .transactionReference("Down payment for loan: " + request.getFinanceCompany())
                        .notes("Customer down payment")
                        .idempotencyKey("DOWN-PAY-" + savedSale.getId())
                        .build();

                paymentRepository.save(downPaymentEntry);
                savedSale.getPayments().add(downPaymentEntry);
                totalPaid = totalPaid.add(downPayment);
            }

            // Generate monthly EMI Amortization Schedule
            LocalDate currentDue = financeDetail.getLoanStartDate().plusMonths(1).withDayOfMonth(Math.min(financeDetail.getEmiDueDay(), 28));
            BigDecimal remainingPrincipal = request.getLoanAmount();
            BigDecimal monthlyInterestRate = interestRate.divide(BigDecimal.valueOf(1200), 6, RoundingMode.HALF_UP);

            for (int i = 1; i <= request.getTenureMonths(); i++) {
                BigDecimal interestPortion = remainingPrincipal.multiply(monthlyInterestRate).setScale(2, RoundingMode.HALF_UP);
                BigDecimal principalPortion = emiAmount.subtract(interestPortion);
                if (principalPortion.compareTo(remainingPrincipal) > 0 || i == request.getTenureMonths()) {
                    principalPortion = remainingPrincipal;
                }
                remainingPrincipal = remainingPrincipal.subtract(principalPortion);

                EmiScheduleEntity emi = EmiScheduleEntity.builder()
                        .financeDetail(savedFinance)
                        .installmentNumber(i)
                        .dueDate(currentDue)
                        .emiAmount(emiAmount)
                        .principalAmount(principalPortion)
                        .interestAmount(interestPortion)
                        .status("PENDING")
                        .build();

                emiScheduleRepository.save(emi);
                savedFinance.getEmiSchedules().add(emi);
                currentDue = currentDue.plusMonths(1);
            }
        }

        // 3. Process Broker Settlement & Commission Snapshot if BROKER vehicle
        if (vehicle.getOwnershipType() == OwnershipType.BROKER) {
            BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicle.getId())
                    .orElseThrow(() -> new BusinessRuleViolationException("Broker vehicle missing listing agreement record"));

            BigDecimal settlementBasis = listing.getAskingPrice();
            BigDecimal grossCommission;

            if (listing.getCommissionType() == CommissionType.FIXED) {
                grossCommission = listing.getCommissionRate();
            } else {
                grossCommission = finalSalePrice.multiply(listing.getCommissionRate())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            // Deduct shop-borne repair expenses and other shop expenses (only finalized job cards)
            List<JobCardEntity> jobCards = jobCardRepository.findByVehicleId(vehicle.getId());
            BigDecimal shopRepairCost = jobCards.stream()
                    .filter(jc -> jc.getStatus() == com.ims.enums.JobCardStatus.COMPLETED || jc.getStatus() == com.ims.enums.JobCardStatus.CLOSED)
                    .map(JobCardEntity::getShopCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal brokerRepairDeduction = jobCards.stream()
                    .filter(jc -> jc.getStatus() == com.ims.enums.JobCardStatus.COMPLETED || jc.getStatus() == com.ims.enums.JobCardStatus.CLOSED)
                    .map(JobCardEntity::getBrokerCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<ShopExpenseEntity> expenses = shopExpenseRepository.findByVehicleId(vehicle.getId());
            BigDecimal otherExpenses = expenses.stream()
                    .map(ShopExpenseEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netCommission = grossCommission.subtract(shopRepairCost).subtract(otherExpenses);

            // Broker settlement amount: Final Sale Price - Gross Commission - Broker funded repairs
            BigDecimal brokerAmount = finalSalePrice.subtract(grossCommission);
            BigDecimal netPayable = brokerAmount.subtract(brokerRepairDeduction);

            // Persist immutable Commission snapshot
            BrokerCommissionEntity commSnapshot = BrokerCommissionEntity.builder()
                    .broker(listing.getBroker())
                    .vehicle(vehicle)
                    .saleId(savedSale.getId())
                    .commissionType(listing.getCommissionType())
                    .salePrice(finalSalePrice)
                    .brokerSettlementBasis(settlementBasis)
                    .grossCommission(grossCommission)
                    .shopRepairDeduction(shopRepairCost)
                    .otherShopExpenseDeduction(otherExpenses)
                    .netCommission(netCommission)
                    .calculatedAt(Instant.now())
                    .build();
            brokerCommissionRepository.save(commSnapshot);

            // Create Broker Settlement obligation
            BrokerSettlementEntity settlement = BrokerSettlementEntity.builder()
                    .broker(listing.getBroker())
                    .vehicle(vehicle)
                    .saleId(savedSale.getId())
                    .saleAmount(finalSalePrice)
                    .brokerAmount(brokerAmount)
                    .grossCommission(grossCommission)
                    .otherDeductions(brokerRepairDeduction)
                    .netPayable(netPayable)
                    .paidAmount(BigDecimal.ZERO)
                    .balanceAmount(netPayable)
                    .settlementStatus(SettlementStatus.PENDING)
                    .build();
            brokerSettlementRepository.save(settlement);

            log.info("Broker vehicle [{}] sold. Net Commission: ₹{}, Net Payable to Broker: ₹{}",
                    vehicle.getRegistrationNumber(), netCommission, netPayable);
        }

        // 4. Update Sale Status
        if (request.getSaleType() == SaleType.DIRECT && totalPaid.compareTo(finalSalePrice) >= 0) {
            savedSale.setStatus(SaleStatus.COMPLETED);
        }
        SaleEntity finalSavedSale = saleRepository.save(savedSale);

        // 5. Transition vehicle state machine to SOLD
        statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.SOLD, "Sale confirmed: " + saleNumber, username);
        log.info("Sale [{}] confirmed for vehicle [{}] at ₹{}", saleNumber, vehicle.getRegistrationNumber(), finalSalePrice);

        return toSaleResponse(finalSavedSale);
    }

    @Override
    @Transactional
    public PaymentResponse recordPayment(Long saleId, PaymentCreateRequest request, String username) {
        // Idempotency verification: if key exists, return idempotent response safely
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            Optional<PaymentEntity> existing = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                log.info("Idempotent payment retry detected for key: {}", request.getIdempotencyKey());
                return toPaymentResponse(existing.get());
            }
        }

        SaleEntity sale = saleRepository.findByIdForUpdate(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", saleId));

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BusinessRuleViolationException("Cannot record payment for a cancelled sale");
        }

        BigDecimal alreadyPaid = sale.getPayments().stream()
                .map(PaymentEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balanceDue = sale.getFinalSalePrice().subtract(alreadyPaid);

        if (request.getAmount().compareTo(balanceDue) > 0) {
            throw new PaymentConflictException(String.format("Payment amount (₹%s) exceeds outstanding balance (₹%s)",
                    request.getAmount(), balanceDue));
        }

        String receiptNo = "REC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentEntity payment = PaymentEntity.builder()
                .receiptNumber(receiptNo)
                .sale(sale)
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .notes(request.getNotes())
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        PaymentEntity savedPayment = paymentRepository.save(payment);
        sale.getPayments().add(savedPayment);

        BigDecimal newTotalPaid = alreadyPaid.add(request.getAmount());
        if (sale.getSaleType() == SaleType.DIRECT && newTotalPaid.compareTo(sale.getFinalSalePrice()) >= 0) {
            sale.setStatus(SaleStatus.COMPLETED);
            saleRepository.save(sale);
        }

        log.info("Payment of ₹{} recorded for sale [{}]. Receipt: {}", request.getAmount(), sale.getSaleNumber(), receiptNo);
        return toPaymentResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Long id) {
        SaleEntity sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        return toSaleResponse(sale);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> getAllSales(SaleType saleType, SaleStatus status, Pageable pageable) {
        Specification<SaleEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (saleType != null) {
                predicates.add(cb.equal(root.get("saleType"), saleType));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<SaleEntity> page = saleRepository.findAll(spec, pageable);
        List<SaleResponse> dtos = page.getContent().stream()
                .map(this::toSaleResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional
    public DeliveryResponse deliverVehicle(Long saleId, DeliveryCreateRequest request, String username) {
        SaleEntity sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", saleId));

        if (deliveryRepository.findBySaleId(saleId).isPresent()) {
            throw new DuplicateResourceException("Vehicle for sale [" + sale.getSaleNumber() + "] is already marked delivered");
        }

        // Direct sales must be fully paid before delivery
        if (sale.getSaleType() == SaleType.DIRECT && sale.getStatus() != SaleStatus.COMPLETED) {
            BigDecimal totalPaid = sale.getPayments().stream()
                    .map(PaymentEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal balance = sale.getFinalSalePrice().subtract(totalPaid);
            throw new BusinessRuleViolationException("Cannot deliver vehicle for Direct sale until full payment is received. Outstanding balance: ₹" + balance);
        }

        VehicleEntity vehicle = sale.getVehicle();
        vehicle.setOdometerReading(request.getOdometerAtDelivery());
        vehicleRepository.save(vehicle);

        DeliveryEntity delivery = DeliveryEntity.builder()
                .sale(sale)
                .vehicle(vehicle)
                .deliveryDate(request.getDeliveryDate())
                .recipientName(request.getRecipientName().trim())
                .recipientPhone(request.getRecipientPhone().trim())
                .odometerAtDelivery(request.getOdometerAtDelivery())
                .deliveryStatus("DELIVERED")
                .documentPath(request.getDocumentPath())
                .notes(request.getNotes())
                .deliveredAt(Instant.now())
                .build();

        DeliveryEntity saved = deliveryRepository.save(delivery);
        sale.setDelivery(saved);

        // Transition vehicle status to DELIVERED
        statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.DELIVERED, "Vehicle physically delivered to customer: " + request.getRecipientName(), username);
        log.info("Vehicle [{}] delivered under sale [{}] to recipient [{}]",
                vehicle.getRegistrationNumber(), sale.getSaleNumber(), request.getRecipientName());

        return toDeliveryResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryBySaleId(Long saleId) {
        DeliveryEntity delivery = deliveryRepository.findBySaleId(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery record for sale", "id", saleId));
        return toDeliveryResponse(delivery);
    }

    // ==========================================
    // HELPER MAPPERS
    // ==========================================

    private SaleResponse toSaleResponse(SaleEntity entity) {
        BigDecimal totalPaid = entity.getPayments() == null ? BigDecimal.ZERO :
                entity.getPayments().stream()
                        .map(PaymentEntity::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balanceDue = entity.getFinalSalePrice().subtract(totalPaid);

        List<PaymentResponse> paymentDtos = entity.getPayments() == null ? Collections.emptyList() :
                entity.getPayments().stream()
                        .map(this::toPaymentResponse)
                        .collect(Collectors.toList());

        SaleResponse.FinanceSummaryDto finDto = null;
        if (entity.getFinanceDetail() != null) {
            FinanceDetailEntity fd = entity.getFinanceDetail();
            finDto = SaleResponse.FinanceSummaryDto.builder()
                    .id(fd.getId())
                    .financeCompany(fd.getFinanceCompany())
                    .loanAccountNumber(fd.getLoanAccountNumber())
                    .loanAmount(fd.getLoanAmount())
                    .downPayment(fd.getDownPayment())
                    .interestRate(fd.getInterestRate())
                    .tenureMonths(fd.getTenureMonths())
                    .emiAmount(fd.getEmiAmount())
                    .status(fd.getStatus().name())
                    .build();
        }

        SaleResponse.DeliverySummaryDto delDto = null;
        if (entity.getDelivery() != null) {
            DeliveryEntity d = entity.getDelivery();
            delDto = SaleResponse.DeliverySummaryDto.builder()
                    .id(d.getId())
                    .deliveryDate(d.getDeliveryDate())
                    .recipientName(d.getRecipientName())
                    .odometerAtDelivery(d.getOdometerAtDelivery())
                    .deliveryStatus(d.getDeliveryStatus())
                    .build();
        }

        return SaleResponse.builder()
                .id(entity.getId())
                .saleNumber(entity.getSaleNumber())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .customerMobile(entity.getCustomer().getMobile())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .vehicleBrand(entity.getVehicle().getBrand())
                .vehicleModel(entity.getVehicle().getModel())
                .ownershipType(entity.getVehicle().getOwnershipType())
                .saleDate(entity.getSaleDate())
                .saleType(entity.getSaleType())
                .agreedPrice(entity.getAgreedPrice())
                .discountAmount(entity.getDiscountAmount())
                .finalSalePrice(entity.getFinalSalePrice())
                .totalPaid(totalPaid)
                .balanceDue(balanceDue)
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .payments(paymentDtos)
                .finance(finDto)
                .delivery(delDto)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private PaymentResponse toPaymentResponse(PaymentEntity entity) {
        return PaymentResponse.builder()
                .id(entity.getId())
                .receiptNumber(entity.getReceiptNumber())
                .saleId(entity.getSale().getId())
                .saleNumber(entity.getSale().getSaleNumber())
                .paymentDate(entity.getPaymentDate())
                .amount(entity.getAmount())
                .paymentMethod(entity.getPaymentMethod())
                .transactionReference(entity.getTransactionReference())
                .notes(entity.getNotes())
                .idempotencyKey(entity.getIdempotencyKey())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private DeliveryResponse toDeliveryResponse(DeliveryEntity entity) {
        return DeliveryResponse.builder()
                .id(entity.getId())
                .saleId(entity.getSale().getId())
                .saleNumber(entity.getSale().getSaleNumber())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .deliveryDate(entity.getDeliveryDate())
                .recipientName(entity.getRecipientName())
                .recipientPhone(entity.getRecipientPhone())
                .odometerAtDelivery(entity.getOdometerAtDelivery())
                .deliveryStatus(entity.getDeliveryStatus())
                .documentPath(entity.getDocumentPath())
                .notes(entity.getNotes())
                .deliveredAt(entity.getDeliveredAt())
                .build();
    }
}
