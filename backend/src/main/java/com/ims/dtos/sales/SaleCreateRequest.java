package com.ims.dtos.sales;

import com.ims.enums.SaleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class SaleCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Sale date is required")
    private LocalDate saleDate;

    @NotNull(message = "Sale type is required (DIRECT, FINANCE)")
    private SaleType saleType;

    @NotNull(message = "Agreed selling price is required")
    @DecimalMin(value = "1.00", message = "Agreed price must be greater than zero")
    private BigDecimal agreedPrice;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private Long bookingId; // Optional: converts booking advance into sale payment

    private String notes;

    // Optional initial payment upon sale creation (for DIRECT sales or down payments)
    private BigDecimal initialPayment;
    private com.ims.enums.PaymentMethod paymentMode;
    private String paymentReference;

    // Required if SaleType == FINANCE
    private String financeCompany;
    private String loanAccountNumber;
    private BigDecimal loanAmount;
    private BigDecimal downPayment;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal emiAmount;
    private Integer emiDueDay;
    private LocalDate loanStartDate;
    private LocalDate loanEndDate;
    private String financeType; // IN_HOUSE, EXTERNAL_BANK
    private Long lenderId;
}
