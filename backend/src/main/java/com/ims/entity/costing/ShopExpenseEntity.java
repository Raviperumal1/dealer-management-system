package com.ims.entity.costing;

import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "shop_expenses")
public class ShopExpenseEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category", nullable = false, length = 100)
    private String category; // RTA_FEES, TRANSPORT, FUEL, DETAILING, REPAIR, BROKER_COMMISSION, MISC

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id")
    private BrokerEntity broker;

    @Column(name = "payment_method", nullable = false, length = 30)
    @Builder.Default
    private String paymentMethod = "CASH";

    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
