package com.ims.dtos.inventory;

import com.ims.enums.PaymentTerms;
import com.ims.enums.SupplierType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierUpdateRequest {

    private String name;
    private SupplierType supplierType;
    private String contactPerson;
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
    private Boolean creditEnabled;
    private BigDecimal creditLimit;
    private Integer creditPeriodDays;
    private PaymentTerms paymentTerms;
    private Boolean active;
    private String notes;
}
