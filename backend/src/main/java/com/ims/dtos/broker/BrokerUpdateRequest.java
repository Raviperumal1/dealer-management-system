package com.ims.dtos.broker;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrokerUpdateRequest {

    @NotBlank(message = "Broker name is required")
    private String name;

    private String email;
    private String address;
    private String idProofType;
    private String notes;
    private Boolean active;
}
