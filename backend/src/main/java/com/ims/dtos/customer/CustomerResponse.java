package com.ims.dtos.customer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {

    private Long id;
    private String name;
    private String mobile;
    private String email;
    private String address;
    private String idProofType;
    private String idProofNumber;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
