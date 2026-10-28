package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
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
@Table(name = "emi_schedules", indexes = {
        @Index(name = "idx_emi_due_date", columnList = "due_date, status")
})
public class EmiScheduleEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finance_id", nullable = false)
    private FinanceDetailEntity financeDetail;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "emi_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal emiAmount;

    @Column(name = "principal_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal interestAmount;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PAID, OVERDUE

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "principal_remaining", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal principalRemaining = BigDecimal.ZERO;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "penalty_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;
}
