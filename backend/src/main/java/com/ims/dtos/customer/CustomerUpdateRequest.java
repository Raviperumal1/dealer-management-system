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
public class CustomerUpdateRequest {

    @NotBlank(message = "Customer name is required")
    private String name;

    private String email;
    private String address;
    private String idProofType;
    private String idProofNumber;
    private Boolean active;
}
