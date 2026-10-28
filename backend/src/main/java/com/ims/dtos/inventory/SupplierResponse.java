package com.ims.dtos.inventory;

import com.ims.enums.PaymentTerms;
import com.ims.enums.SupplierType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {

    private Long id;
    private String supplierCode;
    private String name;
    private SupplierType supplierType;
    private String contactPerson;
    private String mobile;
    private String alternateContact;
    private String email;
    private String gstNumber;
    private String panNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String bankDetails;
    private BigDecimal openingOutstandingBalance;
    private BigDecimal openingAdvanceBalance;
    private Boolean creditEnabled;
    private BigDecimal creditLimit;
    private Integer creditPeriodDays;
    private PaymentTerms paymentTerms;
    private String notes;
    private boolean active;
    private Instant createdAt;

    // Computed financial summary
    private BigDecimal totalPurchases;
    private BigDecimal totalPayments;
    private BigDecimal outstandingAmount;
    private BigDecimal overdueAmount;
    private BigDecimal availableCredit;
    private LocalDate nextDueDate;
    private LocalDate lastPurchaseDate;
    private LocalDate lastPaymentDate;
}
