package com.ims.dtos.workshop;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.ims.enums.JobCardStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobCardStatusUpdateRequest {

    @NotNull(message = "Job card status is required")
    @JsonAlias({"targetStatus"})
    private JobCardStatus status;

    private LocalDate completionDate;
    private String remarks;
}
