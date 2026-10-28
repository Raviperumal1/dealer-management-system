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
@Table(name = "lender_commission_receipts")
public class LenderCommissionReceiptEntity extends BaseEntity {

    @Column(name = "receipt_reference", nullable = false, unique = true, length = 64)
    private String receiptReference;

    @Column(name = "lender_id", nullable = false)
    private Long lenderId;

    @Column(name = "lender_name", nullable = false, length = 150)
    private String lenderName;

    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    @Column(name = "total_received_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalReceivedAmount;

    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private String paymentMethod = "BANK_TRANSFER";

    @Column(name = "bank_utr_reference", nullable = false, length = 100)
    private String bankUtrReference;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "allocated_amount", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal allocatedAmount = BigDecimal.ZERO;

    @Column(name = "unallocated_balance", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unallocatedBalance = BigDecimal.ZERO;

    @Column(name = "tds_deducted_by_bank", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal tdsDeductedByBank = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "VERIFIED"; // PENDING_VERIFICATION, VERIFIED, REVERSED

    @Column(name = "reconciliation_notes", columnDefinition = "TEXT")
    private String reconciliationNotes;
}
