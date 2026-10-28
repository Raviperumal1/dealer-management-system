package com.ims.entity.workshop;

import com.ims.enums.InspectionResult;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inspection_items")
public class InspectionItemEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private InspectionEntity inspection;

    @Column(name = "checkpoint_name", nullable = false, length = 100)
    private String checkpointName;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 30)
    private InspectionResult result;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "estimated_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;
}
