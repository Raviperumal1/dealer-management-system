package com.ims.dtos.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierStatementResponse {

    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal openingBalance;
    private BigDecimal totalDebits;  // Payments made
    private BigDecimal totalCredits; // Purchases
    private BigDecimal closingBalance;
    private List<SupplierLedgerEntryResponse> entries;
}
