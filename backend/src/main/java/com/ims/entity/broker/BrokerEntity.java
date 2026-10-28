package com.ims.entity.broker;

import com.ims.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "brokers")
public class BrokerEntity extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "mobile", nullable = false, unique = true, length = 30)
    private String mobile;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "id_proof_type", length = 50)
    private String idProofType;

    @Column(name = "id_proof_document_path", length = 255)
    private String idProofDocumentPath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "broker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BrokerVehicleListingEntity> listings = new ArrayList<>();
}
