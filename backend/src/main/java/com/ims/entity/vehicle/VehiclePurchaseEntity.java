package com.ims.entity.vehicle;

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
@Table(name = "vehicle_purchases")
public class VehiclePurchaseEntity extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false, unique = true)
    private VehicleEntity vehicle;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "seller_name", nullable = false, length = 150)
    private String sellerName;

    @Column(name = "seller_phone", nullable = false, length = 30)
    private String sellerPhone;

    @Column(name = "seller_address", length = 255)
    private String sellerAddress;

    @Column(name = "purchase_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "purchase_expenses", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal purchaseExpenses = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
