package com.ims.entity.sales;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.finance.FinanceDetailEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.SaleStatus;
import com.ims.enums.SaleType;
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
@Table(name = "sales", indexes = {
        @Index(name = "idx_sale_number", columnList = "sale_number", unique = true),
        @Index(name = "idx_sale_vehicle", columnList = "vehicle_id", unique = true),
        @Index(name = "idx_sale_type", columnList = "sale_type"),
        @Index(name = "idx_sale_status", columnList = "status")
})
public class SaleEntity extends BaseEntity {

    @Column(name = "sale_number", nullable = false, unique = true, length = 50)
    private String saleNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "sale_type", nullable = false, length = 20)
    private SaleType saleType; // DIRECT, FINANCE

    @Column(name = "agreed_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal agreedPrice;

    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_sale_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal finalSalePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private SaleStatus status = SaleStatus.IN_PROGRESS; // IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "customer_contribution", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal customerContribution = BigDecimal.ZERO;

    @Column(name = "lender_disbursement", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal lenderDisbursement = BigDecimal.ZERO;

    @Column(name = "trade_in_allowance", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal tradeInAllowance = BigDecimal.ZERO;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PaymentEntity> payments = new ArrayList<>();

    @OneToOne(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private FinanceDetailEntity financeDetail;

    @OneToOne(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DeliveryEntity delivery;

    public BigDecimal getTotalPaid() {
        if (payments == null || payments.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return payments.stream()
                .map(PaymentEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getBalanceDue() {
        BigDecimal totalPaid = getTotalPaid();
        if (finalSalePrice == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal diff = finalSalePrice.subtract(totalPaid);
        return diff.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : diff;
    }
}
