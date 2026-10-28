package com.ims.service.serviceInterface.vehicle;

import com.ims.common.PageResponse;
import com.ims.dtos.vehicle.*;
import com.ims.enums.OwnershipType;
import com.ims.enums.VehicleStatus;
import com.ims.enums.VehicleType;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface VehicleService {
    VehicleResponse createVehicle(VehicleCreateRequest request, String username);
    VehicleResponse getVehicleById(Long id);
    VehicleResponse updateVehicle(Long id, VehicleUpdateRequest request);
    VehicleResponse updateVehicleStatus(Long id, VehicleStatusUpdateRequest request, String username);
    List<VehicleHistoryResponse> getVehicleHistory(Long id);
    PageResponse<VehicleResponse> getAvailableVehicles(VehicleType type, OwnershipType ownership, String brand, String search, Pageable pageable);
    PageResponse<VehicleResponse> getAllVehicles(VehicleType type, OwnershipType ownership, VehicleStatus status, String search, Pageable pageable);

    // Photo & Document Management
    VehicleResponse uploadPhoto(Long vehicleId, MultipartFile file, String caption, boolean isPrimary);
    VehicleResponse setPrimaryPhoto(Long vehicleId, Long photoId);
    VehicleResponse deletePhoto(Long vehicleId, Long photoId);
    VehicleResponse uploadDocument(Long vehicleId, MultipartFile file, String documentType, String documentName);
    VehicleResponse deleteDocument(Long vehicleId, Long documentId);
}
