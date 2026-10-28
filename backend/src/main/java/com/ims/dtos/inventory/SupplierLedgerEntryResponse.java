package com.ims.dtos.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierLedgerEntryResponse {

    private Long id;
    private Long supplierId;
    private String supplierName;
    private LocalDate entryDate;
    private String referenceType;
    private String referenceNumber;
    private String description;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal runningBalance;
    private String createdByUser;
}
