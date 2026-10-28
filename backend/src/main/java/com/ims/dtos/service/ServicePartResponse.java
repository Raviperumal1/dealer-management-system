package com.ims.dtos.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServicePartResponse {

    private Long id;
    private Long partId;
    private String partName;
    private String partNumber;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
}
