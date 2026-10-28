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
@Table(name = "job_card_labour")
public class JobCardLabourEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_card_id", nullable = false)
    private JobCardEntity jobCard;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @Column(name = "labour_hours", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal labourHours = BigDecimal.ONE;

    @Column(name = "hourly_rate", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;
}
