package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "finance_applications", indexes = {
        @Index(name = "idx_fa_app_no", columnList = "application_number", unique = true),
        @Index(name = "idx_fa_status", columnList = "status"),
        @Index(name = "idx_fa_finance_type", columnList = "finance_type")
})
public class FinanceApplicationEntity extends BaseEntity {

    @Column(name = "application_number", nullable = false, unique = true, length = 50)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "finance_type", nullable = false, length = 50)
    @Builder.Default
    private String financeType = "IN_HOUSE"; // IN_HOUSE, EXTERNAL_BANK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lender_id")
    private FinanceLenderEntity lender;

    @Column(name = "lender_name", length = 150)
    private String lenderName;

    @Column(name = "applicant_name", nullable = false, length = 150)
    private String applicantName;

    @Column(name = "applicant_phone", nullable = false, length = 30)
    private String applicantPhone;

    @Column(name = "applicant_email", length = 150)
    private String applicantEmail;

    @Column(name = "employment_type", length = 50)
    private String employmentType; // SALARIED, SELF_EMPLOYED, BUSINESS

    @Column(name = "declared_monthly_income", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal declaredMonthlyIncome = BigDecimal.ZERO;

    @Column(name = "total_vehicle_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalVehiclePrice;

    @Column(name = "down_payment", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal downPayment = BigDecimal.ZERO;

    @Column(name = "trade_in_credit", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal tradeInCredit = BigDecimal.ZERO;

    @Column(name = "requested_loan_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal requestedLoanAmount;

    @Column(name = "requested_tenure_months", nullable = false)
    private Integer requestedTenureMonths;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "estimated_emi", nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedEmi;

    @Column(name = "processing_fee", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal processingFee = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "SUBMITTED"; // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, SANCTIONED, DISBURSED, REJECTED, CANCELLED

    @Column(name = "sanctioned_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal sanctionedAmount = BigDecimal.ZERO;

    @Column(name = "sanction_letter_reference", length = 100)
    private String sanctionLetterReference;

    @Column(name = "sanction_date")
    private LocalDate sanctionDate;

    @Column(name = "sanction_valid_until")
    private LocalDate sanctionValidUntil;

    @Column(name = "disbursed_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal disbursedAmount = BigDecimal.ZERO;

    @Column(name = "disbursement_date")
    private LocalDate disbursementDate;

    @Column(name = "disbursement_reference", length = 100)
    private String disbursementReference;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user", length = 100)
    private String createdByUser;
}
