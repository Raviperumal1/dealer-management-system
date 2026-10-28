package com.ims.entity.service;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.FollowUpStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "service_follow_ups", indexes = {
        @Index(name = "idx_sfu_status_date", columnList = "status, follow_up_date")
})
public class ServiceFollowUpEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_record_id")
    private ServiceRecordEntity serviceRecord;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @Column(name = "follow_up_date", nullable = false)
    private LocalDate followUpDate;

    @Column(name = "outcome", length = 255)
    private String outcome;

    @Column(name = "next_follow_up_date")
    private LocalDate nextFollowUpDate;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "assigned_staff", length = 150)
    private String assignedStaff;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FollowUpStatus status = FollowUpStatus.UPCOMING;
}
