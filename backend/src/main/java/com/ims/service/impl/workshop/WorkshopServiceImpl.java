package com.ims.service.impl.workshop;

import com.ims.common.PageResponse;
import com.ims.dtos.workshop.*;
import com.ims.entity.inventory.PartEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.workshop.*;
import com.ims.enums.CostResponsibility;
import com.ims.enums.InspectionResult;
import com.ims.enums.JobCardStatus;
import com.ims.enums.StockMovementType;
import com.ims.enums.VehicleStatus;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.inventory.PartRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.*;
import com.ims.service.serviceInterface.inventory.StockLedgerService;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import com.ims.service.serviceInterface.workshop.WorkshopService;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkshopServiceImpl implements WorkshopService {

    private final InspectionRepository inspectionRepository;
    private final InspectionItemRepository inspectionItemRepository;
    private final JobCardRepository jobCardRepository;
    private final JobCardItemRepository jobCardItemRepository;
    private final JobCardPartRepository jobCardPartRepository;
    private final JobCardLabourRepository jobCardLabourRepository;
    private final VehicleRepository vehicleRepository;
    private final PartRepository partRepository;
    private final StockLedgerService stockLedgerService;
    private final StatusWorkflowService statusWorkflowService;

    // ==========================================
    // INSPECTIONS
    // ==========================================

    @Override
    @Transactional
    public InspectionResponse createInspection(InspectionCreateRequest request) {
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        InspectionResult overall = InspectionResult.GOOD;
        List<InspectionItemEntity> items = new ArrayList<>();
        InspectionEntity inspection = InspectionEntity.builder()
                .vehicle(vehicle)
                .inspectorName(request.getInspectorName().trim())
                .inspectionDate(request.getInspectionDate())
                .overallRemarks(request.getOverallRemarks())
                .build();

        for (InspectionCreateRequest.CheckpointItemRequest cp : request.getCheckpoints()) {
            if (cp.getResult() == InspectionResult.REPLACE || cp.getResult() == InspectionResult.NEED_REPAIR) {
                overall = cp.getResult();
            }
            InspectionItemEntity item = InspectionItemEntity.builder()
                    .inspection(inspection)
                    .checkpointName(cp.getCheckpointName().trim())
                    .result(cp.getResult())
                    .remarks(cp.getRemarks())
                    .estimatedCost(cp.getEstimatedCost() != null ? cp.getEstimatedCost() : BigDecimal.ZERO)
                    .build();
            items.add(item);
        }

        inspection.setOverallResult(overall);
        inspection.setItems(items);

        InspectionEntity saved = inspectionRepository.save(inspection);

        // Transition vehicle to INSPECTION status if eligible
        if (statusWorkflowService.isValidTransition(vehicle, VehicleStatus.INSPECTION)) {
            statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.INSPECTION, "Vehicle inspection started", request.getInspectorName());
        }

        return toInspectionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionResponse getInspectionById(Long id) {
        InspectionEntity inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection", "id", id));
        return toInspectionResponse(inspection);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InspectionResponse> getInspectionsByVehicle(Long vehicleId) {
        return inspectionRepository.findByVehicleId(vehicleId).stream()
                .map(this::toInspectionResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    // JOB CARDS
    // ==========================================

    @Override
    @Transactional
    public JobCardResponse createJobCard(JobCardCreateRequest request) {
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));

        InspectionEntity inspection = null;
        if (request.getInspectionId() != null) {
            inspection = inspectionRepository.findById(request.getInspectionId()).orElse(null);
        }

        String jcNumber = "JC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BigDecimal partsCost = BigDecimal.ZERO;
        BigDecimal labourCost = BigDecimal.ZERO;

        List<JobCardPartEntity> partsList = new ArrayList<>();
        List<JobCardLabourEntity> labourList = new ArrayList<>();
        List<JobCardItemEntity> itemsList = new ArrayList<>();

        JobCardEntity jobCard = JobCardEntity.builder()
                .jobCardNumber(jcNumber)
                .vehicle(vehicle)
                .inspection(inspection)
                .assignedStaff(request.getAssignedStaff())
                .startDate(request.getStartDate())
                .completionDate(request.getCompletionDate())
                .status(JobCardStatus.OPEN)
                .costResponsibility(request.getCostResponsibility())
                .remarks(request.getRemarks())
                .build();

        // 1. Process tasks
        if (request.getTasks() != null) {
            for (JobCardCreateRequest.JobCardTaskRequest t : request.getTasks()) {
                JobCardItemEntity item = JobCardItemEntity.builder()
                        .jobCard(jobCard)
                        .taskDescription(t.getTaskDescription())
                        .estimatedCost(t.getEstimatedCost() != null ? t.getEstimatedCost() : BigDecimal.ZERO)
                        .actualCost(t.getActualCost() != null ? t.getActualCost() : BigDecimal.ZERO)
                        .status("PENDING")
                        .build();
                itemsList.add(item);
            }
        }

        // 2. Process parts and reduce stock automatically
        if (request.getParts() != null) {
            for (JobCardCreateRequest.JobCardPartRequest p : request.getParts()) {
                PartEntity part = partRepository.findById(p.getPartId())
                        .orElseThrow(() -> new ResourceNotFoundException("Part", "id", p.getPartId()));

                BigDecimal price = p.getUnitPrice() != null ? p.getUnitPrice() : part.getSellingPrice();
                BigDecimal totalLine = price.multiply(BigDecimal.valueOf(p.getQuantity()));
                partsCost = partsCost.add(totalLine);

                // Concurrency-safe stock reduction via StockLedgerService
                stockLedgerService.recordStockOut(
                        part.getId(),
                        p.getQuantity(),
                        StockMovementType.JOB_CARD_USAGE,
                        jcNumber,
                        vehicle,
                        "Consumed in Job Card " + jcNumber,
                        request.getAssignedStaff()
                );

                JobCardPartEntity jcp = JobCardPartEntity.builder()
                        .jobCard(jobCard)
                        .part(part)
                        .quantity(p.getQuantity())
                        .unitPrice(price)
                        .totalPrice(totalLine)
                        .build();
                partsList.add(jcp);
            }
        }

        // 3. Process labour entries
        if (request.getLabour() != null) {
            for (JobCardCreateRequest.JobCardLabourRequest l : request.getLabour()) {
                BigDecimal hours = l.getLabourHours() != null ? l.getLabourHours() : BigDecimal.ONE;
                BigDecimal rate = l.getHourlyRate() != null ? l.getHourlyRate() : BigDecimal.ZERO;
                BigDecimal totalLine = hours.multiply(rate);
                labourCost = labourCost.add(totalLine);

                JobCardLabourEntity jcl = JobCardLabourEntity.builder()
                        .jobCard(jobCard)
                        .description(l.getDescription())
                        .labourHours(hours)
                        .hourlyRate(rate)
                        .totalAmount(totalLine)
                        .build();
                labourList.add(jcl);
            }
        }

        BigDecimal calculatedTotal = partsCost.add(labourCost);
        BigDecimal totalCost = request.getTotalCost() != null ? request.getTotalCost() : calculatedTotal;

        // Reconcile Cost Responsibility Allocations (SHOP, BROKER, SHARED)
        BigDecimal shopCost = BigDecimal.ZERO;
        BigDecimal brokerCost = BigDecimal.ZERO;

        if (request.getCostResponsibility() == CostResponsibility.SHOP) {
            shopCost = totalCost;
            brokerCost = BigDecimal.ZERO;
        } else if (request.getCostResponsibility() == CostResponsibility.BROKER) {
            brokerCost = totalCost;
            shopCost = BigDecimal.ZERO;
        } else if (request.getCostResponsibility() == CostResponsibility.CUSTOMER) {
            // Customer-borne repairs do not capitalize into dealer inventory cost
            shopCost = BigDecimal.ZERO;
            brokerCost = BigDecimal.ZERO;
        } else if (request.getCostResponsibility() == CostResponsibility.SHARED) {
            shopCost = request.getShopCost() != null ? request.getShopCost() : BigDecimal.ZERO;
            brokerCost = request.getBrokerCost() != null ? request.getBrokerCost() : BigDecimal.ZERO;

            if (shopCost.add(brokerCost).compareTo(totalCost) != 0) {
                throw new BusinessRuleViolationException(String.format(
                        "Shared responsibility split mismatch: Shop (₹%s) + Broker (₹%s) must equal Total Cost (₹%s)",
                        shopCost, brokerCost, totalCost
                ));
            }
        }

        jobCard.setTotalCost(totalCost);
        jobCard.setShopCost(shopCost);
        jobCard.setBrokerCost(brokerCost);
        jobCard.setItems(itemsList);
        jobCard.setParts(partsList);
        jobCard.setLabourEntries(labourList);

        JobCardEntity saved = jobCardRepository.save(jobCard);

        // Transition vehicle to JOB_CARD / REPAIR status if applicable
        if (statusWorkflowService.isValidTransition(vehicle, VehicleStatus.JOB_CARD)) {
            statusWorkflowService.validateAndTransition(vehicle, VehicleStatus.JOB_CARD, "Job card initiated: " + jcNumber, request.getAssignedStaff());
        }

        return toJobCardResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public JobCardResponse getJobCardById(Long id) {
        JobCardEntity jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", id));
        return toJobCardResponse(jobCard);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobCardResponse> getJobCardsByVehicle(Long vehicleId) {
        return jobCardRepository.findByVehicleId(vehicleId).stream()
                .map(this::toJobCardResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<JobCardResponse> getAllJobCards(JobCardStatus status, Pageable pageable) {
        Specification<JobCardEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<JobCardEntity> page = jobCardRepository.findAll(spec, pageable);
        List<JobCardResponse> dtos = page.getContent().stream()
                .map(this::toJobCardResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional
    public JobCardResponse updateJobCard(Long id, JobCardUpdateRequest request) {
        JobCardEntity jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", id));

        if (jobCard.getStatus() == JobCardStatus.COMPLETED) {
            throw new BusinessRuleViolationException("Cannot edit a completed job card");
        }

        if (request.getAssignedStaff() != null) jobCard.setAssignedStaff(request.getAssignedStaff());
        if (request.getCompletionDate() != null) jobCard.setCompletionDate(request.getCompletionDate());
        if (request.getRemarks() != null) jobCard.setRemarks(request.getRemarks());

        if (request.getCostResponsibility() != null) {
            jobCard.setCostResponsibility(request.getCostResponsibility());
            BigDecimal total = request.getTotalCost() != null ? request.getTotalCost() : jobCard.getTotalCost();
            BigDecimal shop = request.getShopCost() != null ? request.getShopCost() : BigDecimal.ZERO;
            BigDecimal broker = request.getBrokerCost() != null ? request.getBrokerCost() : BigDecimal.ZERO;

            if (request.getCostResponsibility() == CostResponsibility.SHOP) {
                shop = total;
                broker = BigDecimal.ZERO;
            } else if (request.getCostResponsibility() == CostResponsibility.BROKER) {
                broker = total;
                shop = BigDecimal.ZERO;
            } else if (request.getCostResponsibility() == CostResponsibility.CUSTOMER) {
                shop = BigDecimal.ZERO;
                broker = BigDecimal.ZERO;
            } else if (request.getCostResponsibility() == CostResponsibility.SHARED) {
                if (shop.add(broker).compareTo(total) != 0) {
                    throw new BusinessRuleViolationException("Shared split mismatch: shop + broker must equal total");
                }
            }
            jobCard.setTotalCost(total);
            jobCard.setShopCost(shop);
            jobCard.setBrokerCost(broker);
        }

        JobCardEntity saved = jobCardRepository.save(jobCard);
        return toJobCardResponse(saved);
    }

    @Override
    @Transactional
    public JobCardResponse updateJobCardStatus(Long id, JobCardStatusUpdateRequest request, String username) {
        JobCardEntity jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", id));

        jobCard.setStatus(request.getStatus());
        if (request.getCompletionDate() != null) {
            jobCard.setCompletionDate(request.getCompletionDate());
        } else if ((request.getStatus() == JobCardStatus.COMPLETED || request.getStatus() == JobCardStatus.CLOSED) && jobCard.getCompletionDate() == null) {
            jobCard.setCompletionDate(LocalDate.now());
        }
        if (request.getRemarks() != null) {
            jobCard.setRemarks(request.getRemarks());
        }

        JobCardEntity saved = jobCardRepository.save(jobCard);

        // When job card completes or closes, check if vehicle is ready for sale
        if (request.getStatus() == JobCardStatus.COMPLETED || request.getStatus() == JobCardStatus.CLOSED) {
            VehicleEntity vehicle = saved.getVehicle();
            boolean hasActiveJobCards = jobCardRepository.findByVehicleId(vehicle.getId()).stream()
                    .anyMatch(jc -> jc.getStatus() == JobCardStatus.OPEN || jc.getStatus() == JobCardStatus.IN_PROGRESS || jc.getStatus() == JobCardStatus.WAITING_FOR_PARTS);

            if (!hasActiveJobCards && statusWorkflowService.isValidTransition(vehicle, VehicleStatus.READY_FOR_SALE)) {
                statusWorkflowService.validateAndTransition(
                        vehicle,
                        VehicleStatus.READY_FOR_SALE,
                        "All workshop repairs completed. Job Card: " + saved.getJobCardNumber(),
                        username
                );
            }
        }

        return toJobCardResponse(saved);
    }

    // ==========================================
    // HELPER MAPPERS
    // ==========================================

    private InspectionResponse toInspectionResponse(InspectionEntity entity) {
        List<InspectionResponse.CheckpointItemDto> cpDtos = entity.getItems() == null ? Collections.emptyList() :
                entity.getItems().stream().map(item -> InspectionResponse.CheckpointItemDto.builder()
                        .id(item.getId())
                        .checkpointName(item.getCheckpointName())
                        .result(item.getResult())
                        .remarks(item.getRemarks())
                        .estimatedCost(item.getEstimatedCost())
                        .build()
                ).collect(Collectors.toList());

        return InspectionResponse.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .inspectorName(entity.getInspectorName())
                .inspectionDate(entity.getInspectionDate())
                .overallRemarks(entity.getOverallRemarks())
                .overallResult(entity.getOverallResult())
                .checkpoints(cpDtos)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private JobCardResponse toJobCardResponse(JobCardEntity entity) {
        List<JobCardResponse.JobCardTaskDto> taskDtos = entity.getItems() == null ? Collections.emptyList() :
                entity.getItems().stream().map(t -> JobCardResponse.JobCardTaskDto.builder()
                        .id(t.getId())
                        .taskDescription(t.getTaskDescription())
                        .estimatedCost(t.getEstimatedCost())
                        .actualCost(t.getActualCost())
                        .status(t.getStatus())
                        .build()
                ).collect(Collectors.toList());

        List<JobCardResponse.JobCardPartDto> partDtos = entity.getParts() == null ? Collections.emptyList() :
                entity.getParts().stream().map(p -> JobCardResponse.JobCardPartDto.builder()
                        .id(p.getId())
                        .partId(p.getPart().getId())
                        .partSku(p.getPart().getSku())
                        .partName(p.getPart().getName())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .totalPrice(p.getTotalPrice())
                        .build()
                ).collect(Collectors.toList());

        List<JobCardResponse.JobCardLabourDto> labourDtos = entity.getLabourEntries() == null ? Collections.emptyList() :
                entity.getLabourEntries().stream().map(l -> JobCardResponse.JobCardLabourDto.builder()
                        .id(l.getId())
                        .description(l.getDescription())
                        .labourHours(l.getLabourHours())
                        .hourlyRate(l.getHourlyRate())
                        .totalAmount(l.getTotalAmount())
                        .build()
                ).collect(Collectors.toList());

        return JobCardResponse.builder()
                .id(entity.getId())
                .jobCardNumber(entity.getJobCardNumber())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistrationNumber(entity.getVehicle().getRegistrationNumber())
                .inspectionId(entity.getInspection() != null ? entity.getInspection().getId() : null)
                .assignedStaff(entity.getAssignedStaff())
                .startDate(entity.getStartDate())
                .completionDate(entity.getCompletionDate())
                .status(entity.getStatus())
                .costResponsibility(entity.getCostResponsibility())
                .shopCost(entity.getShopCost())
                .brokerCost(entity.getBrokerCost())
                .totalCost(entity.getTotalCost())
                .remarks(entity.getRemarks())
                .tasks(taskDtos)
                .parts(partDtos)
                .labourEntries(labourDtos)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
