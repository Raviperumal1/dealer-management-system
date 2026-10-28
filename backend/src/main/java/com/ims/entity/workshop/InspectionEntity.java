package com.ims.entity.workshop;

import com.ims.entity.base.BaseEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.InspectionResult;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inspections")
public class InspectionEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "inspector_name", nullable = false, length = 150)
    private String inspectorName;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "overall_remarks", columnDefinition = "TEXT")
    private String overallRemarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_result", nullable = false, length = 30)
    @Builder.Default
    private InspectionResult overallResult = InspectionResult.GOOD;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<InspectionItemEntity> items = new ArrayList<>();
}
