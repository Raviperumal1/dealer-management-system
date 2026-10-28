package com.ims.entity.inventory;

import com.ims.entity.base.BaseEntity;
import com.ims.enums.PaymentTerms;
import com.ims.enums.SupplierType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "suppliers", indexes = {
        @Index(name = "idx_supplier_code", columnList = "supplier_code", unique = true),
        @Index(name = "idx_supplier_mobile", columnList = "mobile")
})
public class SupplierEntity extends BaseEntity {

    @Column(name = "supplier_code", length = 50, unique = true)
    private String supplierCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "supplier_type", length = 50)
    @Builder.Default
    private SupplierType supplierType = SupplierType.SPARE_PARTS;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "mobile", nullable = false, length = 30)
    private String mobile;

    @Column(name = "alternate_contact", length = 30)
    private String alternateContact;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "pan_number", length = 30)
    private String panNumber;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 20)
    private String pincode;

    @Column(name = "bank_details", columnDefinition = "TEXT")
    private String bankDetails;

    @Column(name = "opening_outstanding_balance", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal openingOutstandingBalance = BigDecimal.ZERO;

    @Column(name = "opening_advance_balance", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal openingAdvanceBalance = BigDecimal.ZERO;

    @Column(name = "credit_enabled")
    @Builder.Default
    private Boolean creditEnabled = true;

    @Column(name = "credit_limit", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Column(name = "credit_period_days")
    @Builder.Default
    private Integer creditPeriodDays = 30;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_terms", length = 50)
    @Builder.Default
    private PaymentTerms paymentTerms = PaymentTerms.CREDIT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseInvoiceEntity> invoices = new ArrayList<>();
}
