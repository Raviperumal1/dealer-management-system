package com.ims.entity.service;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.ServiceStatus;
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
@Table(name = "service_records", indexes = {
        @Index(name = "idx_sr_service_date", columnList = "service_date"),
        @Index(name = "idx_sr_next_service", columnList = "next_service_date")
})
public class ServiceRecordEntity extends BaseEntity {

    @Column(name = "service_number", nullable = false, unique = true, length = 50)
    private String serviceNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private SaleEntity sale;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "current_km", nullable = false)
    private Integer currentKm;

    @Column(name = "customer_complaint", columnDefinition = "TEXT")
    private String customerComplaint;

    @Column(name = "inspection_notes", columnDefinition = "TEXT")
    private String inspectionNotes;

    @Column(name = "labour_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal labourAmount = BigDecimal.ZERO;

    @Column(name = "parts_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal partsAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;

    @Column(name = "next_service_km")
    private Integer nextServiceKm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ServiceStatus status = ServiceStatus.COMPLETED;

    @Column(name = "assigned_staff", length = 150)
    private String assignedStaff;

    @OneToMany(mappedBy = "serviceRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServicePartEntity> serviceParts = new ArrayList<>();
}
