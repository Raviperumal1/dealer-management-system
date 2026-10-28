package com.ims.entity.inventory;

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
@Table(name = "supplier_ledger_entries", indexes = {
        @Index(name = "idx_sle_supplier_date", columnList = "supplier_id, entry_date")
})
public class SupplierLedgerEntryEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private SupplierEntity supplier;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    // Backward-compatibility with legacy DB schemas
    @Column(name = "transaction_date", insertable = true, updatable = true)
    private LocalDate transactionDate;

    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType; // PURCHASE_INVOICE, PAYMENT, ADVANCE, RETURN_DEBIT_NOTE, OPENING_BALANCE

    // Backward-compatibility with legacy DB schemas
    @Column(name = "entry_type", length = 30)
    private String entryType;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    // Backward-compatibility with legacy DB schemas
    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @PrePersist
    @PreUpdate
    public void syncLegacyFields() {
        if (this.transactionDate == null && this.entryDate != null) {
            this.transactionDate = this.entryDate;
        }
        if (this.entryDate == null && this.transactionDate != null) {
            this.entryDate = this.transactionDate;
        }
        if (this.entryType == null && this.referenceType != null) {
            this.entryType = this.referenceType.length() > 30 ? this.referenceType.substring(0, 30) : this.referenceType;
        }
        if (this.referenceType == null && this.entryType != null) {
            this.referenceType = this.entryType;
        }
        if (this.referenceNo == null && this.referenceNumber != null) {
            this.referenceNo = this.referenceNumber;
        }
        if (this.referenceNumber == null && this.referenceNo != null) {
            this.referenceNumber = this.referenceNo;
        }
    }

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "debit_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal debitAmount = BigDecimal.ZERO; // Payments made to supplier / Returns (decreases payable)

    @Column(name = "credit_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal creditAmount = BigDecimal.ZERO; // Purchases from supplier (increases payable)

    @Column(name = "running_balance", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal runningBalance = BigDecimal.ZERO; // Positive = Dealership owes Supplier; Negative = Advance with Supplier

    @Column(name = "created_by_user", length = 100)
    private String createdByUser;
}
