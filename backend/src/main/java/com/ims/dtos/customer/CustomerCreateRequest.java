package com.ims.dtos.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateRequest {

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Mobile number is required")
    private String mobile;

    private String email;
    private String address;
    private String idProofType;
    private String idProofNumber;
}
