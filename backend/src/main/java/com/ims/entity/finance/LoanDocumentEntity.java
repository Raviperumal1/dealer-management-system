package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "loan_documents", indexes = {
        @Index(name = "idx_ldoc_finance", columnList = "finance_id"),
        @Index(name = "idx_ldoc_customer", columnList = "customer_id"),
        @Index(name = "idx_ldoc_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_ldoc_category", columnList = "category"),
        @Index(name = "idx_ldoc_ref", columnList = "document_reference")
})
public class LoanDocumentEntity extends BaseEntity {

    @Column(name = "document_reference", nullable = false, unique = true, length = 64)
    private String documentReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_id")
    private FinanceDetailEntity financeDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private CustomerEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @Column(name = "category", nullable = false, length = 50)
    private String category; // CUSTOMER, VEHICLE, LOAN, PAYMENT, CLOSURE, NOC

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // NOC_CERTIFICATE, REPAYMENT_SCHEDULE, PAYMENT_RECEIPT, SANCTION_LETTER, LOAN_AGREEMENT, ID_PROOF, RC_COPY, OTHER

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "file_key", nullable = false, length = 150)
    private String fileKey;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "version", length = 20)
    @Builder.Default
    private String version = "1.0";

    @Column(name = "verification_status", length = 30)
    @Builder.Default
    private String verificationStatus = "VERIFIED"; // PENDING, VERIFIED, REJECTED, SUPERSEDED

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
