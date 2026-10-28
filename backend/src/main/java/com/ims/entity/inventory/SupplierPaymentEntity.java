package com.ims.entity.inventory;

import com.ims.entity.base.BaseEntity;
import com.ims.enums.PaymentMethod;
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
@Table(name = "supplier_payments", indexes = {
        @Index(name = "idx_sp_payment_code", columnList = "payment_code", unique = true),
        @Index(name = "idx_sp_supplier_id", columnList = "supplier_id"),
        @Index(name = "idx_sp_invoice_id", columnList = "invoice_id")
})
public class SupplierPaymentEntity extends BaseEntity {

    @Column(name = "payment_code", nullable = false, unique = true, length = 50)
    private String paymentCode;

    // Backward-compatibility with legacy DB schemas
    @Column(name = "payment_number", length = 50)
    private String paymentNumber;

    @PrePersist
    @PreUpdate
    public void syncLegacyFields() {
        if (this.paymentNumber == null && this.paymentCode != null) {
            this.paymentNumber = this.paymentCode;
        }
        if (this.paymentCode == null && this.paymentNumber != null) {
            this.paymentCode = this.paymentNumber;
        }
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private SupplierEntity supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private PurchaseInvoiceEntity invoice; // Optional if direct advance

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "is_advance", nullable = false)
    @Builder.Default
    private boolean advance = false;

    @Column(name = "unallocated_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal unallocatedAmount = BigDecimal.ZERO;

    @Column(name = "branch_warehouse", length = 100)
    private String branchWarehouse;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "created_by_user", length = 100)
    private String createdByUser;
}
