package com.ims.dtos.reports;

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
public class SalesReportRow {
    private Long saleId;
    private String saleNumber;
    private LocalDate saleDate;
    private String customerName;
    private String vehicleRegistrationNumber;
    private String vehicleType;
    private String ownershipType;
    private String saleType;
    private BigDecimal agreedPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalSalePrice;
    private BigDecimal totalPaid;
    private BigDecimal balanceDue;
    private String status;
}
