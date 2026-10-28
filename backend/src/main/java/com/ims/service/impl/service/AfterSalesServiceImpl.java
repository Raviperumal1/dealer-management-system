package com.ims.service.impl.service;

import com.ims.common.PageResponse;
import com.ims.dtos.service.*;
import com.ims.entity.inventory.PartEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.service.ServiceFollowUpEntity;
import com.ims.entity.service.ServicePartEntity;
import com.ims.entity.service.ServiceRecordEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.FollowUpStatus;
import com.ims.enums.ServiceStatus;
import com.ims.enums.StockMovementType;
import com.ims.enums.VehicleStatus;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.inventory.PartRepository;
import com.ims.repository.sales.CustomerRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.repository.service.ServiceFollowUpRepository;
import com.ims.repository.service.ServicePartRepository;
import com.ims.repository.service.ServiceRecordRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.serviceInterface.inventory.StockLedgerService;
import com.ims.service.serviceInterface.service.AfterSalesService;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AfterSalesServiceImpl implements AfterSalesService {

    private final ServiceRecordRepository serviceRecordRepository;
    private final ServicePartRepository servicePartRepository;
    private final ServiceFollowUpRepository serviceFollowUpRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final SaleRepository saleRepository;
    private final PartRepository partRepository;
    private final StockLedgerService stockLedgerService;
    private final StatusWorkflowService statusWorkflowService;

    @Override
    @Transactional
    public ServiceRecordResponse createServiceRecord(ServiceRecordCreateRequest request, String username) {
        CustomerEntity customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        SaleEntity sale = null;
        if (request.getSaleId() != null) {
            sale = saleRepository.findById(request.getSaleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + request.getSaleId()));
        }

        String serviceNumber = "SRV-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BigDecimal labourAmount = request.getLabourAmount() != null ? request.getLabourAmount() : BigDecimal.ZERO;
        BigDecimal partsTotal = BigDecimal.ZERO;

        ServiceRecordEntity record = ServiceRecordEntity.builder()
                .serviceNumber(serviceNumber)
                .customer(customer)
                .vehicle(vehicle)
                .sale(sale)
                .serviceDate(request.getServiceDate())
                .currentKm(request.getCurrentKm())
                .customerComplaint(request.getCustomerComplaint())
                .inspectionNotes(request.getInspectionNotes())
                .labourAmount(labourAmount)
                .partsAmount(BigDecimal.ZERO)
                .totalAmount(labourAmount)
                .nextServiceDate(request.getNextServiceDate())
                .nextServiceKm(request.getNextServiceKm())
                .status(request.getStatus() != null ? request.getStatus() : ServiceStatus.COMPLETED)
                .assignedStaff(request.getAssignedStaff())
                .build();

        ServiceRecordEntity savedRecord = serviceRecordRepository.save(record);

        // Process parts if provided
        if (request.getParts() != null && !request.getParts().isEmpty()) {
            for (ServicePartRequest pReq : request.getParts()) {
                PartEntity part = partRepository.findById(pReq.getPartId())
                        .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + pReq.getPartId()));

                BigDecimal unitPrice = pReq.getUnitPrice() != null ? pReq.getUnitPrice() : part.getSellingPrice();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(pReq.getQuantity()));

                // Consume inventory stock transactionally
                stockLedgerService.recordStockOut(
                        part.getId(),
                        pReq.getQuantity(),
                        StockMovementType.SERVICE_USAGE,
                        serviceNumber,
                        vehicle,
                        "Consumed in Service Record: " + serviceNumber,
                        username
                );

                ServicePartEntity partEntity = ServicePartEntity.builder()
                        .serviceRecord(savedRecord)
                        .part(part)
                        .quantity(pReq.getQuantity())
                        .unitPrice(unitPrice)
                        .totalAmount(lineTotal)
                        .build();

                savedRecord.getServiceParts().add(partEntity);
                partsTotal = partsTotal.add(lineTotal);
            }
        }

        savedRecord.setPartsAmount(partsTotal);
        savedRecord.setTotalAmount(labourAmount.add(partsTotal));
        savedRecord = serviceRecordRepository.save(savedRecord);

        // Update vehicle odometer if higher
        if (request.getCurrentKm() > vehicle.getOdometerReading()) {
            vehicle.setOdometerReading(request.getCurrentKm());
            vehicleRepository.save(vehicle);
        }

        // Advance vehicle state to SERVICE_FOLLOWUP if DELIVERED
        if (vehicle.getStatus() == VehicleStatus.DELIVERED) {
            statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.SERVICE_FOLLOWUP, "Initiated service record: " + serviceNumber, username);
        }

        // Automatically create a follow-up reminder if next service date is present
        if (request.getNextServiceDate() != null) {
            ServiceFollowUpEntity followUp = ServiceFollowUpEntity.builder()
                    .serviceRecord(savedRecord)
                    .vehicle(vehicle)
                    .customer(customer)
                    .followUpDate(request.getNextServiceDate().minusDays(3)) // Remind 3 days before due date
                    .nextFollowUpDate(request.getNextServiceDate())
                    .remarks("Scheduled routine service follow-up for target KM: " + (request.getNextServiceKm() != null ? request.getNextServiceKm() : "N/A"))
                    .assignedStaff(request.getAssignedStaff())
                    .status(FollowUpStatus.UPCOMING)
                    .build();
            serviceFollowUpRepository.save(followUp);
        }

        log.info("Service record created: {} for vehicle: {}", serviceNumber, vehicle.getRegistrationNumber());
        return mapToServiceResponse(savedRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRecordResponse getServiceRecordById(Long id) {
        ServiceRecordEntity entity = serviceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service record not found with id: " + id));
        return mapToServiceResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceRecordResponse> getAllServiceRecords(Long customerId, Long vehicleId, ServiceStatus status, Pageable pageable) {
        Specification<ServiceRecordEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceRecordEntity> page = serviceRecordRepository.findAll(spec, pageable);
        List<ServiceRecordResponse> content = page.getContent().stream()
                .map(this::mapToServiceResponse)
                .collect(Collectors.toList());

        return PageResponse.<ServiceRecordResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRecordResponse> getDueServices() {
        return serviceRecordRepository.findDueServices(LocalDate.now()).stream()
                .map(this::mapToServiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRecordResponse> getUpcomingServices(Integer daysAhead) {
        int days = daysAhead != null ? daysAhead : 7;
        LocalDate today = LocalDate.now();
        LocalDate target = today.plusDays(days);
        return serviceRecordRepository.findUpcomingServices(today, target).stream()
                .map(this::mapToServiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRecordResponse> getOverdueServices() {
        return serviceRecordRepository.findOverdueServices(LocalDate.now()).stream()
                .map(this::mapToServiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FollowUpResponse createFollowUp(FollowUpCreateRequest request, String username) {
        CustomerEntity customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        ServiceRecordEntity record = null;
        if (request.getServiceRecordId() != null) {
            record = serviceRecordRepository.findById(request.getServiceRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service record not found with id: " + request.getServiceRecordId()));
        }

        ServiceFollowUpEntity followUp = ServiceFollowUpEntity.builder()
                .serviceRecord(record)
                .vehicle(vehicle)
                .customer(customer)
                .followUpDate(request.getFollowUpDate())
                .outcome(request.getOutcome())
                .nextFollowUpDate(request.getNextFollowUpDate())
                .remarks(request.getRemarks())
                .assignedStaff(request.getAssignedStaff())
                .status(request.getStatus() != null ? request.getStatus() : FollowUpStatus.UPCOMING)
                .build();

        ServiceFollowUpEntity saved = serviceFollowUpRepository.save(followUp);
        return mapToFollowUpResponse(saved);
    }

    @Override
    @Transactional
    public FollowUpResponse updateFollowUp(Long id, FollowUpUpdateRequest request, String username) {
        ServiceFollowUpEntity entity = serviceFollowUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        if (request.getOutcome() != null) entity.setOutcome(request.getOutcome());
        if (request.getNextFollowUpDate() != null) entity.setNextFollowUpDate(request.getNextFollowUpDate());
        if (request.getRemarks() != null) entity.setRemarks(request.getRemarks());
        if (request.getAssignedStaff() != null) entity.setAssignedStaff(request.getAssignedStaff());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        ServiceFollowUpEntity updated = serviceFollowUpRepository.save(entity);
        return mapToFollowUpResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FollowUpResponse> getAllFollowUps(FollowUpStatus status, Long customerId, Long vehicleId, Pageable pageable) {
        Specification<ServiceFollowUpEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceFollowUpEntity> page = serviceFollowUpRepository.findAll(spec, pageable);
        List<FollowUpResponse> content = page.getContent().stream()
                .map(this::mapToFollowUpResponse)
                .collect(Collectors.toList());

        return PageResponse.<FollowUpResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    private ServiceRecordResponse mapToServiceResponse(ServiceRecordEntity entity) {
        List<ServicePartResponse> parts = new ArrayList<>();
        if (entity.getServiceParts() != null) {
            for (ServicePartEntity p : entity.getServiceParts()) {
                parts.add(ServicePartResponse.builder()
                        .id(p.getId())
                        .partId(p.getPart().getId())
                        .partName(p.getPart().getName())
                        .partNumber(p.getPart().getSku())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .totalAmount(p.getTotalAmount())
                        .build());
            }
        }

        return ServiceRecordResponse.builder()
                .id(entity.getId())
                .serviceNumber(entity.getServiceNumber())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .customerMobile(entity.getCustomer().getMobile())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .vehicleBrand(entity.getVehicle().getBrand())
                .vehicleModel(entity.getVehicle().getModel())
                .saleId(entity.getSale() != null ? entity.getSale().getId() : null)
                .serviceDate(entity.getServiceDate())
                .currentKm(entity.getCurrentKm())
                .customerComplaint(entity.getCustomerComplaint())
                .inspectionNotes(entity.getInspectionNotes())
                .labourAmount(entity.getLabourAmount())
                .partsAmount(entity.getPartsAmount())
                .totalAmount(entity.getTotalAmount())
                .nextServiceDate(entity.getNextServiceDate())
                .nextServiceKm(entity.getNextServiceKm())
                .status(entity.getStatus())
                .assignedStaff(entity.getAssignedStaff())
                .parts(parts)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private FollowUpResponse mapToFollowUpResponse(ServiceFollowUpEntity entity) {
        return FollowUpResponse.builder()
                .id(entity.getId())
                .serviceRecordId(entity.getServiceRecord() != null ? entity.getServiceRecord().getId() : null)
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .vehicleBrand(entity.getVehicle().getBrand())
                .vehicleModel(entity.getVehicle().getModel())
                .customerId(entity.getCustomer().getId())
                .customerName(entity.getCustomer().getName())
                .customerMobile(entity.getCustomer().getMobile())
                .followUpDate(entity.getFollowUpDate())
                .outcome(entity.getOutcome())
                .nextFollowUpDate(entity.getNextFollowUpDate())
                .remarks(entity.getRemarks())
                .assignedStaff(entity.getAssignedStaff())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
