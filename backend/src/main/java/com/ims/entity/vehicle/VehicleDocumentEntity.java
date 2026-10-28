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
@Table(name = "vehicle_documents")
public class VehicleDocumentEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType; // RC, INSURANCE, POLLUTION, SELLER_ID, OTHER

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();
}
