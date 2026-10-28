package com.ims.entity.vehicle;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "vehicle_photos")
public class VehiclePhotoEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "photo_url", nullable = false, length = 255)
    private String photoUrl;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean primary = false;

    @Column(name = "caption", length = 150)
    private String caption;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();
}
