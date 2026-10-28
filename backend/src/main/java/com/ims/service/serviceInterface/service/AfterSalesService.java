package com.ims.service.serviceInterface.service;

import com.ims.common.PageResponse;
import com.ims.dtos.service.*;
import com.ims.enums.FollowUpStatus;
import com.ims.enums.ServiceStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AfterSalesService {
    ServiceRecordResponse createServiceRecord(ServiceRecordCreateRequest request, String username);
    ServiceRecordResponse getServiceRecordById(Long id);
    PageResponse<ServiceRecordResponse> getAllServiceRecords(Long customerId, Long vehicleId, ServiceStatus status, Pageable pageable);
    List<ServiceRecordResponse> getDueServices();
    List<ServiceRecordResponse> getUpcomingServices(Integer daysAhead);
    List<ServiceRecordResponse> getOverdueServices();

    FollowUpResponse createFollowUp(FollowUpCreateRequest request, String username);
    FollowUpResponse updateFollowUp(Long id, FollowUpUpdateRequest request, String username);
    PageResponse<FollowUpResponse> getAllFollowUps(FollowUpStatus status, Long customerId, Long vehicleId, Pageable pageable);
}
