package com.ims.dtos.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceDashboardMetricsResponse {
    private long totalApplications;
    private long pendingApplications;
    private long approvedApplications;
    private long disbursedApplications;
    private long activeLoans;
    private long closedLoans;
    private long overdueEmisCount;
    private BigDecimal totalPrincipalOutstanding;
    private BigDecimal totalCollectionsThisMonth; // Real EMI + loan cash receipts this month
    private BigDecimal totalDisbursedThisMonth; // Real verified lender disbursements this month
    private BigDecimal overdueAmount;
    private BigDecimal totalInterestAccrued;
    private BigDecimal totalPrincipalCollectedThisMonth;
    private BigDecimal totalInterestCollectedThisMonth;
    private BigDecimal totalSettlementCollectedThisMonth;
    private BigDecimal totalAmountRepaidCumulative;
    private BigDecimal totalCustomerReceivables;
}
