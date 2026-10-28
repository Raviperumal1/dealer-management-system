package com.ims.service.impl.broker;

import com.ims.common.PageResponse;
import com.ims.dtos.broker.*;
import com.ims.entity.broker.*;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.OwnershipType;
import com.ims.enums.SettlementStatus;
import com.ims.enums.VehicleStatus;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.PaymentConflictException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.mapper.BrokerMapper;
import com.ims.repository.broker.*;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.serviceInterface.broker.BrokerService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrokerServiceImpl implements BrokerService {

    private final BrokerRepository brokerRepository;
    private final BrokerVehicleListingRepository brokerListingRepository;
    private final BrokerSettlementRepository settlementRepository;
    private final BrokerSettlementPaymentRepository settlementPaymentRepository;
    private final VehicleRepository vehicleRepository;
    private final BrokerMapper brokerMapper;

    @Override
    @Transactional
    public BrokerResponse createBroker(BrokerCreateRequest request) {
        String mobile = request.getMobile().trim();
        if (brokerRepository.existsByMobile(mobile)) {
            throw new DuplicateResourceException("Broker with mobile number '" + mobile + "' already exists");
        }

        BrokerEntity broker = BrokerEntity.builder()
                .name(request.getName().trim())
                .mobile(mobile)
                .email(request.getEmail())
                .address(request.getAddress())
                .idProofType(request.getIdProofType())
                .notes(request.getNotes())
                .active(true)
                .build();

        BrokerEntity saved = brokerRepository.save(broker);
        return brokerMapper.toResponse(saved, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public BrokerResponse getBrokerById(Long id) {
        BrokerEntity broker = brokerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", id));
        long count = brokerListingRepository.countByBrokerId(id);
        return brokerMapper.toResponse(broker, count);
    }

    @Override
    @Transactional
    public BrokerResponse updateBroker(Long id, BrokerUpdateRequest request) {
        BrokerEntity broker = brokerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", id));

        broker.setName(request.getName().trim());
        broker.setEmail(request.getEmail());
        broker.setAddress(request.getAddress());
        broker.setIdProofType(request.getIdProofType());
        broker.setNotes(request.getNotes());
        if (request.getActive() != null) {
            broker.setActive(request.getActive());
        }

        BrokerEntity updated = brokerRepository.save(broker);
        long count = brokerListingRepository.countByBrokerId(id);
        return brokerMapper.toResponse(updated, count);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BrokerResponse> getAllBrokers(String search, Boolean active, Pageable pageable) {
        Specification<BrokerEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchLike = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchLike);
                Predicate mobileLike = cb.like(cb.lower(root.get("mobile")), searchLike);
                predicates.add(cb.or(nameLike, mobileLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BrokerEntity> page = brokerRepository.findAll(spec, pageable);
        List<BrokerResponse> dtos = page.getContent().stream()
                .map(b -> brokerMapper.toResponse(b, brokerListingRepository.countByBrokerId(b.getId())))
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional
    public BrokerListingResponse addBrokerVehicleListing(Long brokerId, BrokerListingCreateRequest request) {
        BrokerEntity broker = brokerRepository.findById(brokerId)
                .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", brokerId));

        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        if (vehicle.getOwnershipType() != OwnershipType.BROKER) {
            throw new BusinessRuleViolationException("Cannot list an OWN dealership vehicle under a broker");
        }

        if (brokerListingRepository.findByVehicleId(vehicle.getId()).isPresent()) {
            throw new DuplicateResourceException("Vehicle already listed under a broker");
        }

        BrokerVehicleListingEntity listing = BrokerVehicleListingEntity.builder()
                .broker(broker)
                .vehicle(vehicle)
                .askingPrice(request.getAskingPrice())
                .expectedSellingPrice(request.getExpectedSellingPrice())
                .commissionType(request.getCommissionType())
                .commissionRate(request.getCommissionRate())
                .listingDate(request.getListingDate() != null ? request.getListingDate() : LocalDate.now())
                .listingStatus("ACTIVE")
                .notes(request.getNotes())
                .build();

        BrokerVehicleListingEntity saved = brokerListingRepository.save(listing);
        return brokerMapper.toListingResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrokerListingResponse> getBrokerListings(Long brokerId) {
        if (!brokerRepository.existsById(brokerId)) {
            throw new ResourceNotFoundException("Broker", "id", brokerId);
        }
        return brokerListingRepository.findByBrokerId(brokerId).stream()
                .map(brokerMapper::toListingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BrokerDashboardResponse getBrokerDashboard(Long brokerId) {
        BrokerEntity broker = brokerRepository.findById(brokerId)
                .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", brokerId));

        List<BrokerVehicleListingEntity> listings = brokerListingRepository.findByBrokerId(brokerId);
        long totalListed = listings.size();
        long available = listings.stream()
                .filter(l -> l.getVehicle().getStatus() == VehicleStatus.AVAILABLE ||
                        l.getVehicle().getStatus() == VehicleStatus.READY_FOR_SALE)
                .count();
        long sold = listings.stream()
                .filter(l -> l.getVehicle().getStatus() == VehicleStatus.SOLD ||
                        l.getVehicle().getStatus() == VehicleStatus.DELIVERED ||
                        l.getVehicle().getStatus() == VehicleStatus.SETTLED ||
                        l.getVehicle().getStatus() == VehicleStatus.SETTLEMENT_PENDING)
                .count();

        List<BrokerSettlementEntity> settlements = settlementRepository.findByBrokerId(brokerId);

        BigDecimal totalTransactionVal = BigDecimal.ZERO;
        BigDecimal grossCommission = BigDecimal.ZERO;
        BigDecimal shopExpenses = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;

        long pendingSettlements = 0;
        long partiallyPaidSettlements = 0;
        long paidSettlements = 0;

        for (BrokerSettlementEntity s : settlements) {
            totalTransactionVal = totalTransactionVal.add(s.getSaleAmount());
            grossCommission = grossCommission.add(s.getGrossCommission());
            shopExpenses = shopExpenses.add(s.getOtherDeductions());
            totalPaid = totalPaid.add(s.getPaidAmount());
            totalBalance = totalBalance.add(s.getBalanceAmount());

            if (s.getSettlementStatus() == SettlementStatus.PENDING) pendingSettlements++;
            else if (s.getSettlementStatus() == SettlementStatus.PARTIALLY_PAID) partiallyPaidSettlements++;
            else if (s.getSettlementStatus() == SettlementStatus.PAID) paidSettlements++;
        }

        BigDecimal netCommission = grossCommission.subtract(shopExpenses);

        return BrokerDashboardResponse.builder()
                .brokerId(broker.getId())
                .brokerName(broker.getName())
                .totalListedVehicles(totalListed)
                .availableVehicles(available)
                .soldVehicles(sold)
                .totalTransactionValue(totalTransactionVal)
                .grossCommission(grossCommission)
                .shopBorneExpenses(shopExpenses)
                .netCommission(netCommission)
                .pendingSettlementsCount(pendingSettlements)
                .partiallyPaidSettlementsCount(partiallyPaidSettlements)
                .paidSettlementsCount(paidSettlements)
                .totalPaidToBroker(totalPaid)
                .totalBalancePayable(totalBalance)
                .build();
    }

    @Override
    @Transactional
    public SettlementResponse recordSettlementPayment(Long settlementId, SettlementPaymentRequest request) {
        BrokerSettlementEntity settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));

        if (settlement.getSettlementStatus() == SettlementStatus.PAID) {
            throw new PaymentConflictException("Settlement is already fully paid");
        }

        if (request.getAmount().compareTo(settlement.getBalanceAmount()) > 0) {
            throw new PaymentConflictException(String.format("Payment amount (₹%s) exceeds outstanding settlement balance (₹%s)",
                    request.getAmount(), settlement.getBalanceAmount()));
        }

        BigDecimal newPaidAmount = settlement.getPaidAmount().add(request.getAmount());
        BigDecimal newBalance = settlement.getBalanceAmount().subtract(request.getAmount());

        settlement.setPaidAmount(newPaidAmount);
        settlement.setBalanceAmount(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            settlement.setSettlementStatus(SettlementStatus.PAID);
        } else {
            settlement.setSettlementStatus(SettlementStatus.PARTIALLY_PAID);
        }

        BrokerSettlementPaymentEntity payment = BrokerSettlementPaymentEntity.builder()
                .settlement(settlement)
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .paymentMethod(request.getPaymentMethod())
                .paymentReference(request.getPaymentReference())
                .notes(request.getNotes())
                .build();

        settlementPaymentRepository.save(payment);
        settlement.getPayments().add(payment);

        BrokerSettlementEntity savedSettlement = settlementRepository.save(settlement);
        log.info("Recorded broker settlement payment of ₹{} for settlement id [{}]. Balance remaining: ₹{}",
                request.getAmount(), settlementId, newBalance);

        return brokerMapper.toSettlementResponse(savedSettlement);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SettlementResponse> getSettlements(Long brokerId, SettlementStatus status, Pageable pageable) {
        Specification<BrokerSettlementEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (brokerId != null) {
                predicates.add(cb.equal(root.get("broker").get("id"), brokerId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("settlementStatus"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BrokerSettlementEntity> page = settlementRepository.findAll(spec, pageable);
        List<SettlementResponse> dtos = page.getContent().stream()
                .map(brokerMapper::toSettlementResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public SettlementResponse getSettlementById(Long settlementId) {
        BrokerSettlementEntity settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", "id", settlementId));
        return brokerMapper.toSettlementResponse(settlement);
    }
}
