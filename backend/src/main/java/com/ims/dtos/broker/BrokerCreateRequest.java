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
public class BrokerCreateRequest {

    @NotBlank(message = "Broker name is required")
    private String name;

    @NotBlank(message = "Mobile number is required")
    private String mobile;

    private String email;
    private String address;
    private String idProofType;
    private String notes;
}
