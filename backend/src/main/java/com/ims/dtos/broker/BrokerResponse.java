package com.ims.dtos.broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerResponse {

    private Long id;
    private String name;
    private String mobile;
    private String email;
    private String address;
    private String idProofType;
    private String notes;
    private boolean active;
    private long totalListedVehicles;
    private Instant createdAt;
    private Instant updatedAt;
}
