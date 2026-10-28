package com.ims.service.serviceInterface.sales;

import com.ims.common.PageResponse;
import com.ims.dtos.customer.*;
import org.springframework.data.domain.Pageable;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateRequest request);
    CustomerResponse getCustomerById(Long id);
    CustomerResponse updateCustomer(Long id, CustomerUpdateRequest request);
    PageResponse<CustomerResponse> getAllCustomers(String search, Boolean active, Pageable pageable);
    CustomerHistoryResponse getCustomerHistory(Long customerId);
}
