package com.ims.service.impl.vehicle;

import com.ims.common.PageResponse;
import com.ims.dtos.vehicle.*;
import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.broker.BrokerVehicleListingEntity;
import com.ims.entity.vehicle.*;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.mapper.VehicleMapper;
import com.ims.repository.broker.BrokerRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.repository.vehicle.*;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import com.ims.service.serviceInterface.vehicle.VehicleService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePurchaseRepository purchaseRepository;
    private final VehicleStatusHistoryRepository historyRepository;
    private final BrokerRepository brokerRepository;
    private final BrokerVehicleListingRepository brokerListingRepository;
    private final StatusWorkflowService statusWorkflowService;
    private final VehicleMapper vehicleMapper;
    private final VehiclePhotoRepository vehiclePhotoRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final com.ims.utils.storage.StorageService storageService;

    @Override
    @Transactional
    public VehicleResponse createVehicle(VehicleCreateRequest request, String username) {
        String regNo = request.getRegistrationNumber().trim().toUpperCase();
        if (vehicleRepository.existsByRegistrationNumber(regNo)) {
            throw new DuplicateResourceException("Vehicle with registration number '" + regNo + "' already exists");
        }
        if (vehicleRepository.existsByChassisNumber(request.getChassisNumber().trim())) {
            throw new DuplicateResourceException("Vehicle with chassis number '" + request.getChassisNumber() + "' already exists");
        }
        if (vehicleRepository.existsByEngineNumber(request.getEngineNumber().trim())) {
            throw new DuplicateResourceException("Vehicle with engine number '" + request.getEngineNumber() + "' already exists");
        }

        VehicleStatus initialStatus = (request.getOwnershipType() == OwnershipType.OWN)
                ? VehicleStatus.PURCHASED
                : VehicleStatus.BROKER_LISTED;

        VehicleEntity vehicle = VehicleEntity.builder()
                .registrationNumber(regNo)
                .vehicleType(request.getVehicleType())
                .brand(request.getBrand().trim())
                .model(request.getModel().trim())
                .variant(request.getVariant())
                .manufacturingYear(request.getManufacturingYear())
                .registrationYear(request.getRegistrationYear())
                .fuelType(request.getFuelType())
                .transmission(request.getTransmission())
                .color(request.getColor().trim())
                .odometerReading(request.getOdometerReading())
                .chassisNumber(request.getChassisNumber().trim())
                .engineNumber(request.getEngineNumber().trim())
                .rcNumber(request.getRcNumber())
                .rcExpiryDate(request.getRcExpiryDate())
                .insurancePolicyNumber(request.getInsurancePolicyNumber())
                .insuranceValidityDate(request.getInsuranceValidityDate())
                .ownershipType(request.getOwnershipType())
                .status(initialStatus)
                .build();

        VehicleEntity savedVehicle = vehicleRepository.save(vehicle);

        // Record initial status history
        VehicleStatusHistoryEntity initialHistory = VehicleStatusHistoryEntity.builder()
                .vehicle(savedVehicle)
                .previousStatus(null)
                .newStatus(initialStatus)
                .reason(request.getOwnershipType() == OwnershipType.OWN ? "Initial dealership vehicle purchase" : "Initial broker vehicle listing")
                .changedBy(username != null ? username : "SYSTEM")
                .changedAt(Instant.now())
                .build();
        historyRepository.save(initialHistory);

        BrokerVehicleListingEntity savedListing = null;

        if (request.getOwnershipType() == OwnershipType.OWN) {
            if (request.getPurchasePrice() == null || request.getPurchaseDate() == null || request.getSellerName() == null) {
                throw new BusinessRuleViolationException("Purchase price, purchase date and seller details are mandatory for Own vehicles");
            }

            BigDecimal expenses = request.getPurchaseExpenses() != null ? request.getPurchaseExpenses() : BigDecimal.ZERO;
            VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                    .vehicle(savedVehicle)
                    .purchaseDate(request.getPurchaseDate())
                    .sellerName(request.getSellerName())
                    .sellerPhone(request.getSellerPhone() != null ? request.getSellerPhone() : "")
                    .sellerAddress(request.getSellerAddress())
                    .purchasePrice(request.getPurchasePrice())
                    .purchaseExpenses(expenses)
                    .notes(request.getPurchaseNotes())
                    .build();
            purchaseRepository.save(purchase);
            savedVehicle.setPurchase(purchase);

        } else {
            // Broker vehicle
            if (request.getBrokerId() == null) {
                throw new BusinessRuleViolationException("Broker ID is mandatory for Broker vehicles");
            }
            BrokerEntity broker = brokerRepository.findById(request.getBrokerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", request.getBrokerId()));

            if (request.getBrokerAskingPrice() == null || request.getExpectedSellingPrice() == null) {
                throw new BusinessRuleViolationException("Broker asking price and expected selling price are mandatory for Broker vehicles");
            }

            BrokerVehicleListingEntity listing = BrokerVehicleListingEntity.builder()
                    .broker(broker)
                    .vehicle(savedVehicle)
                    .askingPrice(request.getBrokerAskingPrice())
                    .expectedSellingPrice(request.getExpectedSellingPrice())
                    .commissionType(request.getCommissionType())
                    .commissionRate(request.getCommissionRate() != null ? request.getCommissionRate() : BigDecimal.ZERO)
                    .listingDate(request.getListingDate() != null ? request.getListingDate() : LocalDate.now())
                    .listingStatus("ACTIVE")
                    .notes(request.getListingNotes())
                    .build();
            savedListing = brokerListingRepository.save(listing);
        }

        return vehicleMapper.toResponse(savedVehicle, savedListing);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long id) {
        VehicleEntity vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(id).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleUpdateRequest request) {
        VehicleEntity vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));

        vehicle.setBrand(request.getBrand().trim());
        vehicle.setModel(request.getModel().trim());
        vehicle.setVariant(request.getVariant());
        vehicle.setManufacturingYear(request.getManufacturingYear());
        vehicle.setRegistrationYear(request.getRegistrationYear());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setColor(request.getColor().trim());
        vehicle.setOdometerReading(request.getOdometerReading());
        vehicle.setRcNumber(request.getRcNumber());
        vehicle.setRcExpiryDate(request.getRcExpiryDate());
        vehicle.setInsurancePolicyNumber(request.getInsurancePolicyNumber());
        vehicle.setInsuranceValidityDate(request.getInsuranceValidityDate());

        VehicleEntity updated = vehicleRepository.save(vehicle);
        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(id).orElse(null);
        return vehicleMapper.toResponse(updated, listing);
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicleStatus(Long id, VehicleStatusUpdateRequest request, String username) {
        VehicleEntity vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));

        statusWorkflowService.validateAndTransition(vehicle, request.getStatus(), request.getReason(), username);

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(id).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleHistoryResponse> getVehicleHistory(Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vehicle", "id", id);
        }
        return historyRepository.findByVehicleIdOrderByChangedAtDesc(id).stream()
                .map(h -> VehicleHistoryResponse.builder()
                        .id(h.getId())
                        .vehicleId(h.getVehicle().getId())
                        .previousStatus(h.getPreviousStatus())
                        .newStatus(h.getNewStatus())
                        .reason(h.getReason())
                        .changedBy(h.getChangedBy())
                        .changedAt(h.getChangedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VehicleResponse> getAvailableVehicles(VehicleType type, OwnershipType ownership, String brand, String search, Pageable pageable) {
        Specification<VehicleEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Available or Ready for sale vehicles
            predicates.add(root.get("status").in(VehicleStatus.AVAILABLE, VehicleStatus.READY_FOR_SALE));

            if (type != null) {
                predicates.add(cb.equal(root.get("vehicleType"), type));
            }
            if (ownership != null) {
                predicates.add(cb.equal(root.get("ownershipType"), ownership));
            }
            if (brand != null && !brand.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("brand")), "%" + brand.trim().toLowerCase() + "%"));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchTrim = search.trim().toLowerCase();
                String searchLike = "%" + searchTrim + "%";
                Predicate regLike = cb.like(cb.lower(root.get("registrationNumber")), searchLike);
                Predicate brandLike = cb.like(cb.lower(root.get("brand")), searchLike);
                Predicate modelLike = cb.like(cb.lower(root.get("model")), searchLike);
                Predicate variantLike = cb.like(cb.lower(root.get("variant")), searchLike);
                Predicate colorLike = cb.like(cb.lower(root.get("color")), searchLike);
                Predicate chassisLike = cb.like(cb.lower(root.get("chassisNumber")), searchLike);

                // Space/dash stripped registration search (e.g. 'TN 34' matches 'TN34AJ1210')
                String cleanReg = searchTrim.replaceAll("[\\s-]+", "");
                Predicate cleanRegLike = cb.like(cb.lower(root.get("registrationNumber")), "%" + cleanReg + "%");

                List<Predicate> orPreds = new ArrayList<>(List.of(regLike, brandLike, modelLike, variantLike, colorLike, chassisLike, cleanRegLike));
                String idCandidate = searchTrim.startsWith("#") ? searchTrim.substring(1) : searchTrim;
                if (idCandidate.matches("^\\d+$")) {
                    try {
                        orPreds.add(cb.equal(root.get("id"), Long.parseLong(idCandidate)));
                    } catch (NumberFormatException ignored) {}
                }
                predicates.add(cb.or(orPreds.toArray(new Predicate[0])));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<VehicleEntity> page = vehicleRepository.findAll(spec, pageable);
        List<VehicleResponse> dtos = page.getContent().stream()
                .map(v -> {
                    BrokerVehicleListingEntity listing = (v.getOwnershipType() == OwnershipType.BROKER)
                            ? brokerListingRepository.findByVehicleId(v.getId()).orElse(null)
                            : null;
                    return vehicleMapper.toResponse(v, listing);
                })
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VehicleResponse> getAllVehicles(VehicleType type, OwnershipType ownership, VehicleStatus status, String search, Pageable pageable) {
        Specification<VehicleEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) {
                predicates.add(cb.equal(root.get("vehicleType"), type));
            }
            if (ownership != null) {
                predicates.add(cb.equal(root.get("ownershipType"), ownership));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchTrim = search.trim().toLowerCase();
                String searchLike = "%" + searchTrim + "%";
                Predicate regLike = cb.like(cb.lower(root.get("registrationNumber")), searchLike);
                Predicate brandLike = cb.like(cb.lower(root.get("brand")), searchLike);
                Predicate modelLike = cb.like(cb.lower(root.get("model")), searchLike);
                Predicate variantLike = cb.like(cb.lower(root.get("variant")), searchLike);
                Predicate colorLike = cb.like(cb.lower(root.get("color")), searchLike);
                Predicate chassisLike = cb.like(cb.lower(root.get("chassisNumber")), searchLike);

                // Space/dash stripped registration search (e.g. 'TN 34' matches 'TN34AJ1210')
                String cleanReg = searchTrim.replaceAll("[\\s-]+", "");
                Predicate cleanRegLike = cb.like(cb.lower(root.get("registrationNumber")), "%" + cleanReg + "%");

                List<Predicate> orPreds = new ArrayList<>(List.of(regLike, brandLike, modelLike, variantLike, colorLike, chassisLike, cleanRegLike));
                String idCandidate = searchTrim.startsWith("#") ? searchTrim.substring(1) : searchTrim;
                if (idCandidate.matches("^\\d+$")) {
                    try {
                        orPreds.add(cb.equal(root.get("id"), Long.parseLong(idCandidate)));
                    } catch (NumberFormatException ignored) {}
                }
                predicates.add(cb.or(orPreds.toArray(new Predicate[0])));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<VehicleEntity> page = vehicleRepository.findAll(spec, pageable);
        List<VehicleResponse> dtos = page.getContent().stream()
                .map(v -> {
                    BrokerVehicleListingEntity listing = (v.getOwnershipType() == OwnershipType.BROKER)
                            ? brokerListingRepository.findByVehicleId(v.getId()).orElse(null)
                            : null;
                    return vehicleMapper.toResponse(v, listing);
                })
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional
    public VehicleResponse uploadPhoto(Long vehicleId, org.springframework.web.multipart.MultipartFile file, String caption, boolean isPrimary) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        var uploadResp = storageService.storeFile(file, "VEHICLE_PHOTOS");
        String photoUrl = "/documents/" + uploadResp.getFileKey() + "/download";

        List<VehiclePhotoEntity> existingPhotos = vehiclePhotoRepository.findByVehicleId(vehicleId);
        boolean makePrimary = isPrimary || existingPhotos.isEmpty();

        if (makePrimary) {
            for (VehiclePhotoEntity p : existingPhotos) {
                p.setPrimary(false);
                vehiclePhotoRepository.save(p);
            }
        }

        VehiclePhotoEntity photo = VehiclePhotoEntity.builder()
                .vehicle(vehicle)
                .photoUrl(photoUrl)
                .primary(makePrimary)
                .caption(caption != null && !caption.isBlank() ? caption : uploadResp.getOriginalFileName())
                .uploadedAt(Instant.now())
                .build();

        vehiclePhotoRepository.save(photo);
        vehicle.getPhotos().add(photo);

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional
    public VehicleResponse setPrimaryPhoto(Long vehicleId, Long photoId) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        List<VehiclePhotoEntity> photos = vehiclePhotoRepository.findByVehicleId(vehicleId);
        boolean found = false;
        for (VehiclePhotoEntity p : photos) {
            if (p.getId().equals(photoId)) {
                p.setPrimary(true);
                found = true;
            } else {
                p.setPrimary(false);
            }
            vehiclePhotoRepository.save(p);
        }

        if (!found) {
            throw new ResourceNotFoundException("VehiclePhoto", "id", photoId);
        }

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional
    public VehicleResponse deletePhoto(Long vehicleId, Long photoId) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        VehiclePhotoEntity photo = vehiclePhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("VehiclePhoto", "id", photoId));

        boolean wasPrimary = photo.isPrimary();
        vehicle.getPhotos().remove(photo);
        vehiclePhotoRepository.delete(photo);

        List<VehiclePhotoEntity> remaining = vehiclePhotoRepository.findByVehicleId(vehicleId);
        if (wasPrimary && !remaining.isEmpty()) {
            VehiclePhotoEntity newPrimary = remaining.get(0);
            newPrimary.setPrimary(true);
            vehiclePhotoRepository.save(newPrimary);
        }

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional
    public VehicleResponse uploadDocument(Long vehicleId, org.springframework.web.multipart.MultipartFile file, String documentType, String documentName) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        var uploadResp = storageService.storeFile(file, "VEHICLE_DOCUMENTS");
        String filePath = "/documents/" + uploadResp.getFileKey() + "/download";

        VehicleDocumentEntity doc = VehicleDocumentEntity.builder()
                .vehicle(vehicle)
                .documentType(documentType != null && !documentType.isBlank() ? documentType : "OTHER")
                .documentName(documentName != null && !documentName.isBlank() ? documentName : uploadResp.getOriginalFileName())
                .filePath(filePath)
                .fileSize(uploadResp.getFileSize())
                .contentType(uploadResp.getContentType())
                .uploadedAt(Instant.now())
                .build();

        vehicleDocumentRepository.save(doc);
        vehicle.getDocuments().add(doc);

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }

    @Override
    @Transactional
    public VehicleResponse deleteDocument(Long vehicleId, Long documentId) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        VehicleDocumentEntity doc = vehicleDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleDocument", "id", documentId));

        vehicle.getDocuments().remove(doc);
        vehicleDocumentRepository.delete(doc);

        BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
        return vehicleMapper.toResponse(vehicle, listing);
    }
}
