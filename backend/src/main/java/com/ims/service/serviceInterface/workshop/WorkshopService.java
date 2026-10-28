package com.ims.service.serviceInterface.workshop;

import com.ims.common.PageResponse;
import com.ims.dtos.workshop.*;
import com.ims.enums.JobCardStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WorkshopService {
    InspectionResponse createInspection(InspectionCreateRequest request);
    InspectionResponse getInspectionById(Long id);
    List<InspectionResponse> getInspectionsByVehicle(Long vehicleId);

    JobCardResponse createJobCard(JobCardCreateRequest request);
    JobCardResponse getJobCardById(Long id);
    List<JobCardResponse> getJobCardsByVehicle(Long vehicleId);
    PageResponse<JobCardResponse> getAllJobCards(JobCardStatus status, Pageable pageable);
    JobCardResponse updateJobCard(Long id, JobCardUpdateRequest request);
    JobCardResponse updateJobCardStatus(Long id, JobCardStatusUpdateRequest request, String username);
}
