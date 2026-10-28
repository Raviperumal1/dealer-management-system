package com.ims.service.serviceInterface.finance;

import com.ims.dtos.finance.LenderCommissionRequest;
import com.ims.dtos.finance.LenderCommissionResponse;
import com.ims.dtos.finance.LenderReceiptRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Map;

public interface LenderCommissionService {

    LenderCommissionResponse calculateCommissionPreview(LenderCommissionRequest request);

    LenderCommissionResponse createCommissionEntry(LenderCommissionRequest request, String username);

    LenderCommissionResponse approveCommission(Long commissionId, String remarks, String username);

    LenderCommissionResponse rejectCommission(Long commissionId, String remarks, String username);

    LenderCommissionResponse generateInvoice(Long commissionId, String invoiceNumber, LocalDate invoiceDate, String username);

    LenderCommissionResponse recordReceipt(Long commissionId, LenderReceiptRequest receiptRequest, String username);

    LenderCommissionResponse reverseCommission(Long commissionId, String reason, String username);

    Page<LenderCommissionResponse> getCommissions(Long lenderId, String status, String search, Pageable pageable);

    LenderCommissionResponse getCommissionById(Long id);

    Map<String, Object> getCommissionDashboardMetrics();
}
