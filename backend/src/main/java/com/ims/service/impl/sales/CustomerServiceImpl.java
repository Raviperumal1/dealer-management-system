package com.ims.service.impl.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.customer.*;
import com.ims.dtos.sales.PaymentResponse;
import com.ims.entity.sales.BookingEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.PaymentEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.sales.BookingRepository;
import com.ims.repository.sales.CustomerRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.service.serviceInterface.sales.CustomerService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import com.ims.entity.service.ServiceRecordEntity;
import com.ims.repository.service.ServiceRecordRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        String mobile = request.getMobile().trim();
        if (customerRepository.existsByMobile(mobile)) {
            throw new DuplicateResourceException("Customer with mobile '" + mobile + "' already exists");
        }

        CustomerEntity customer = CustomerEntity.builder()
                .name(request.getName().trim())
                .mobile(mobile)
                .email(request.getEmail())
                .address(request.getAddress())
                .idProofType(request.getIdProofType())
                .idProofNumber(request.getIdProofNumber())
                .active(true)
                .build();

        CustomerEntity saved = customerRepository.save(customer);
        return toCustomerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        CustomerEntity customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return toCustomerResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerUpdateRequest request) {
        CustomerEntity customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        customer.setName(request.getName().trim());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setIdProofType(request.getIdProofType());
        customer.setIdProofNumber(request.getIdProofNumber());
        if (request.getActive() != null) {
            customer.setActive(request.getActive());
        }

        CustomerEntity saved = customerRepository.save(customer);
        return toCustomerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> getAllCustomers(String search, Boolean active, Pageable pageable) {
        Specification<CustomerEntity> spec = (root, query, cb) -> {
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

        Page<CustomerEntity> page = customerRepository.findAll(spec, pageable);
        List<CustomerResponse> dtos = page.getContent().stream()
                .map(this::toCustomerResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerHistoryResponse getCustomerHistory(Long customerId) {
        CustomerEntity customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        List<SaleEntity> sales = saleRepository.findByCustomerId(customerId);
        List<CustomerHistoryResponse.SaleHistoryItem> saleItems = sales.stream().map(s -> {
            List<PaymentResponse> paymentDtos = s.getPayments() == null ? Collections.emptyList() :
                    s.getPayments().stream().map(p -> PaymentResponse.builder()
                            .id(p.getId())
                            .receiptNumber(p.getReceiptNumber())
                            .saleId(s.getId())
                            .saleNumber(s.getSaleNumber())
                            .paymentDate(p.getPaymentDate())
                            .amount(p.getAmount())
                            .paymentMethod(p.getPaymentMethod())
                            .transactionReference(p.getTransactionReference())
                            .notes(p.getNotes())
                            .idempotencyKey(p.getIdempotencyKey())
                            .createdAt(p.getCreatedAt())
                            .build()
                    ).collect(Collectors.toList());

            return CustomerHistoryResponse.SaleHistoryItem.builder()
                    .saleId(s.getId())
                    .saleNumber(s.getSaleNumber())
                    .saleDate(s.getSaleDate())
                    .saleType(s.getSaleType().name())
                    .vehicleId(s.getVehicle().getId())
                    .vehicleRegistrationNumber(s.getVehicle().getRegistrationNumber())
                    .vehicleBrand(s.getVehicle().getBrand())
                    .vehicleModel(s.getVehicle().getModel())
                    .ownershipType(s.getVehicle().getOwnershipType().name())
                    .finalSalePrice(s.getFinalSalePrice())
                    .status(s.getStatus().name())
                    .payments(paymentDtos)
                    .delivered(s.getDelivery() != null)
                    .deliveryDate(s.getDelivery() != null ? s.getDelivery().getDeliveryDate() : null)
                    .build();
        }).collect(Collectors.toList());

        List<BookingEntity> bookings = bookingRepository.findByCustomerId(customerId);
        List<CustomerHistoryResponse.BookingHistoryItem> bookingItems = bookings.stream().map(b ->
                CustomerHistoryResponse.BookingHistoryItem.builder()
                        .bookingId(b.getId())
                        .bookingNumber(b.getBookingNumber())
                        .vehicleId(b.getVehicle().getId())
                        .vehicleRegistrationNumber(b.getVehicle().getRegistrationNumber())
                        .advanceAmount(b.getAdvanceAmount())
                        .bookingDate(b.getBookingDate())
                        .status(b.getStatus().name())
                        .build()
        ).collect(Collectors.toList());

        List<ServiceRecordEntity> serviceList = serviceRecordRepository.findByCustomerIdOrderByServiceDateDesc(customerId);
        List<CustomerHistoryResponse.ServiceHistoryItem> serviceItems = serviceList.stream().map(s ->
                CustomerHistoryResponse.ServiceHistoryItem.builder()
                        .serviceId(s.getId())
                        .serviceNumber(s.getServiceNumber())
                        .serviceDate(s.getServiceDate())
                        .currentKm(s.getCurrentKm())
                        .customerComplaint(s.getCustomerComplaint())
                        .totalAmount(s.getTotalAmount())
                        .nextServiceDate(s.getNextServiceDate())
                        .nextServiceKm(s.getNextServiceKm())
                        .status(s.getStatus().name())
                        .build()
        ).collect(Collectors.toList());

        return CustomerHistoryResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .mobile(customer.getMobile())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .sales(saleItems)
                .bookings(bookingItems)
                .serviceRecords(serviceItems)
                .build();
    }

    private CustomerResponse toCustomerResponse(CustomerEntity entity) {
        return CustomerResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .mobile(entity.getMobile())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .idProofType(entity.getIdProofType())
                .idProofNumber(entity.getIdProofNumber())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
