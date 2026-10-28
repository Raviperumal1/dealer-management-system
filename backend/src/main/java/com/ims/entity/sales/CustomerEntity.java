package com.ims.entity.sales;

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
@Table(name = "customers")
public class CustomerEntity extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "mobile", nullable = false, unique = true, length = 30)
    private String mobile;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "id_proof_type", length = 50)
    private String idProofType; // AADHAAR, PAN, PASSPORT, DRIVING_LICENSE

    @Column(name = "id_proof_number", length = 100)
    private String idProofNumber;

    @Column(name = "id_proof_document_path", length = 255)
    private String idProofDocumentPath;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleEntity> sales = new ArrayList<>();
}
