package com.ims.entity.workshop;

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
@Table(name = "job_card_items")
public class JobCardItemEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_card_id", nullable = false)
    private JobCardEntity jobCard;

    @Column(name = "task_description", nullable = false, length = 255)
    private String taskDescription;

    @Column(name = "estimated_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "actual_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";
}
