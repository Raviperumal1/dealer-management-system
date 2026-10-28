package com.ims.entity.finance;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "loan_ledger_entries", indexes = {
        @Index(name = "idx_lle_finance", columnList = "finance_id"),
        @Index(name = "idx_lle_customer", columnList = "customer_id"),
        @Index(name = "idx_lle_tx_type", columnList = "transaction_type"),
        @Index(name = "idx_lle_date", columnList = "effective_date"),
        @Index(name = "idx_lle_idempotency", columnList = "idempotency_key")
})
public class LoanLedgerEntryEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, unique = true, length = 64)
    private String transactionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finance_id", nullable = false)
    private FinanceDetailEntity financeDetail;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType; // DISBURSEMENT, EMI_PAYMENT, PRINCIPAL_PAYMENT, INTEREST_PAYMENT, PENALTY_ASSESSMENT, FORECLOSURE_SETTLEMENT, WAIVER, REVERSAL

    @Column(name = "entry_direction", nullable = false, length = 10)
    private String entryDirection; // DEBIT (increases debt) or CREDIT (decreases debt)

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "principal_portion", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal principalPortion = BigDecimal.ZERO;

    @Column(name = "interest_portion", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal interestPortion = BigDecimal.ZERO;

    @Column(name = "fee_portion", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal feePortion = BigDecimal.ZERO;

    @Column(name = "penalty_portion", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal penaltyPortion = BigDecimal.ZERO;

    @Column(name = "principal_balance_after", nullable = false, precision = 14, scale = 2)
    private BigDecimal principalBalanceAfter;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "posting_timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime postingTimestamp = LocalDateTime.now();

    @Column(name = "source_reference", length = 100)
    private String sourceReference;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "reversal_reference", length = 100)
    private String reversalReference;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "POSTED";

    @Column(name = "created_by_user", nullable = false, length = 100)
    @Builder.Default
    private String createdByUser = "SYSTEM";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
