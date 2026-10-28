package com.ims.service.serviceInterface.broker;

import com.ims.common.PageResponse;
import com.ims.dtos.broker.*;
import com.ims.enums.SettlementStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BrokerService {
    BrokerResponse createBroker(BrokerCreateRequest request);
    BrokerResponse getBrokerById(Long id);
    BrokerResponse updateBroker(Long id, BrokerUpdateRequest request);
    PageResponse<BrokerResponse> getAllBrokers(String search, Boolean active, Pageable pageable);
    BrokerListingResponse addBrokerVehicleListing(Long brokerId, BrokerListingCreateRequest request);
    List<BrokerListingResponse> getBrokerListings(Long brokerId);
    BrokerDashboardResponse getBrokerDashboard(Long brokerId);
    SettlementResponse recordSettlementPayment(Long settlementId, SettlementPaymentRequest request);
    PageResponse<SettlementResponse> getSettlements(Long brokerId, SettlementStatus status, Pageable pageable);
    SettlementResponse getSettlementById(Long settlementId);
}
