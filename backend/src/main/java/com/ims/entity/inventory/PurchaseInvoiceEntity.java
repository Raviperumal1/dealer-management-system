package com.ims.entity.inventory;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.workshop.JobCardEntity;
import com.ims.enums.PaymentStatus;
import com.ims.enums.PurchaseBillStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "purchase_invoices", indexes = {
        @Index(name = "idx_pi_invoice_no", columnList = "invoice_number", unique = true),
        @Index(name = "idx_pi_supplier_id", columnList = "supplier_id"),
        @Index(name = "idx_pi_status", columnList = "status"),
        @Index(name = "idx_pi_payment_status", columnList = "payment_status")
})
public class PurchaseInvoiceEntity extends BaseEntity {

    @Column(name = "invoice_number", nullable = false, unique = true, length = 100)
    private String invoiceNumber;

    // Backward-compatibility with legacy DB schemas
    @Column(name = "purchase_number", length = 50)
    private String purchaseNumber;

    @Column(name = "supplier_invoice_number", length = 100)
    private String supplierInvoiceNumber;

    @PrePersist
    @PreUpdate
    public void syncLegacyFields() {
        if (this.purchaseNumber == null && this.invoiceNumber != null) {
            this.purchaseNumber = this.invoiceNumber.length() > 50 ? this.invoiceNumber.substring(0, 50) : this.invoiceNumber;
        }
        if (this.invoiceNumber == null && this.purchaseNumber != null) {
            this.invoiceNumber = this.purchaseNumber;
        }
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private SupplierEntity supplier;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "branch_warehouse", length = 100)
    private String branchWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_card_id")
    private JobCardEntity jobCard;

    @Column(name = "subtotal_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "freight_charge", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal freightCharge = BigDecimal.ZERO;

    @Column(name = "other_charges", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "amount_paid", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "amount_outstanding", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amountOutstanding = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PurchaseBillStatus status = PurchaseBillStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "document_path", length = 255)
    private String documentPath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "posted_at")
    private Instant postedAt;

    @Column(name = "created_by_user", length = 100)
    private String createdByUser;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseInvoiceItemEntity> items = new ArrayList<>();
}
