package com.ims.entity.workshop;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.CostResponsibility;
import com.ims.enums.JobCardStatus;
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
@Table(name = "job_cards", indexes = {
        @Index(name = "idx_jc_status", columnList = "status"),
        @Index(name = "idx_jc_number", columnList = "job_card_number", unique = true)
})
public class JobCardEntity extends BaseEntity {

    @Column(name = "job_card_number", nullable = false, unique = true, length = 50)
    private String jobCardNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    private InspectionEntity inspection;

    @Column(name = "assigned_staff", length = 150)
    private String assignedStaff;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private JobCardStatus status = JobCardStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_responsibility", nullable = false, length = 20)
    @Builder.Default
    private CostResponsibility costResponsibility = CostResponsibility.SHOP; // SHOP, BROKER, SHARED

    @Column(name = "shop_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal shopCost = BigDecimal.ZERO;

    @Column(name = "broker_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal brokerCost = BigDecimal.ZERO;

    @Column(name = "total_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @OneToMany(mappedBy = "jobCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JobCardItemEntity> items = new ArrayList<>();

    @OneToMany(mappedBy = "jobCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JobCardPartEntity> parts = new ArrayList<>();

    @OneToMany(mappedBy = "jobCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JobCardLabourEntity> labourEntries = new ArrayList<>();
}
