package com.ims.controller.customer;

import com.ims.common.ApiResponse;
import com.ims.common.PageResponse;
import com.ims.common.PageUtil;
import com.ims.dtos.customer.*;
import com.ims.service.serviceInterface.sales.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Management", description = "Endpoints for customer KYC, profile management, and 360-degree history")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("@permissionService.hasPermission('CUSTOMERS', 'ADD')")
    @Operation(summary = "Create customer", description = "Registers a new customer record with contact information and KYC metadata")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Customer registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("@permissionService.hasPermission('CUSTOMERS', 'VIEW')")
    @Operation(summary = "List customers", description = "Retrieves paginated list of customers with search by name, mobile, email or pan")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        Pageable pageable = PageUtil.createPageable(page, size, sortBy, sortDirection);
        PageResponse<CustomerResponse> response = customerService.getAllCustomers(search, active, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('CUSTOMERS', 'VIEW')")
    @Operation(summary = "Get customer by ID", description = "Retrieves customer profile by identifier")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionService.hasPermission('CUSTOMERS', 'EDIT')")
    @Operation(summary = "Update customer", description = "Updates customer contact details, address, or active status")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerUpdateRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", response));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@permissionService.hasPermission('CUSTOMERS', 'VIEW')")
    @Operation(summary = "Customer 360° History", description = "Returns full historical transactions: bookings, purchases, sales, finance arrangements, payments, delivery details, and workshop/service history")
    public ResponseEntity<ApiResponse<CustomerHistoryResponse>> getCustomerHistory(@PathVariable Long id) {
        CustomerHistoryResponse history = customerService.getCustomerHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
