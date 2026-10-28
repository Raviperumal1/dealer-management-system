package com.ims.dtos.inventory;

import com.ims.enums.PaymentTerms;
import com.ims.enums.SupplierType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierCreateRequest {

    @NotBlank(message = "Supplier / Agency name is required")
    private String name;

    private SupplierType supplierType;

    private String contactPerson;

    @NotBlank(message = "Mobile number is required")
    private String mobile;

    private String alternateContact;

    private String email;

    private String gstNumber;

    private String panNumber;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String bankDetails;

    private BigDecimal openingOutstandingBalance;

    private BigDecimal openingAdvanceBalance;

    private Boolean creditEnabled;

    private BigDecimal creditLimit;

    private Integer creditPeriodDays;

    private PaymentTerms paymentTerms;

    private String notes;
}
