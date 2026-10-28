package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.enums.FinanceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "finance_details")
public class FinanceDetailEntity extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false, unique = true)
    private SaleEntity sale;

    @Column(name = "finance_company", nullable = false, length = 150)
    private String financeCompany;

    @Column(name = "loan_account_number", length = 100)
    private String loanAccountNumber;

    @Column(name = "loan_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "down_payment", nullable = false, precision = 14, scale = 2)
    private BigDecimal downPayment;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate; // Annual %

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "emi_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal emiAmount;

    @Column(name = "emi_due_day", nullable = false)
    @Builder.Default
    private Integer emiDueDay = 5;

    @Column(name = "loan_start_date", nullable = false)
    private LocalDate loanStartDate;

    @Column(name = "loan_end_date", nullable = false)
    private LocalDate loanEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FinanceStatus status = FinanceStatus.ACTIVE; // PENDING, ACTIVE, OVERDUE, CLOSED

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "finance_type", length = 50)
    @Builder.Default
    private String financeType = "IN_HOUSE"; // IN_HOUSE, EXTERNAL_BANK

    @Column(name = "lender_id")
    private Long lenderId;

    @Column(name = "finance_application_id")
    private Long financeApplicationId;

    @Column(name = "processing_fee", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal processingFee = BigDecimal.ZERO;

    @Column(name = "principal_outstanding", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal principalOutstanding = BigDecimal.ZERO;

    @Column(name = "total_interest_accrued", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalInterestAccrued = BigDecimal.ZERO;

    @Column(name = "total_interest_paid", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalInterestPaid = BigDecimal.ZERO;

    @Column(name = "total_principal_paid", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPrincipalPaid = BigDecimal.ZERO;

    @Column(name = "foreclosure_charge", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal foreclosureCharge = BigDecimal.ZERO;

    @Column(name = "closed_date")
    private LocalDate closedDate;

    @Column(name = "closure_remarks", length = 255)
    private String closureRemarks;

    @OneToMany(mappedBy = "financeDetail", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmiScheduleEntity> emiSchedules = new ArrayList<>();
}
