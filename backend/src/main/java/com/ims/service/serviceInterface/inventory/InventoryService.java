package com.ims.service.serviceInterface.inventory;

import com.ims.common.PageResponse;
import com.ims.dtos.inventory.*;
import com.ims.enums.PartCategory;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface InventoryService {
    // Supplier Management
    SupplierResponse createSupplier(SupplierCreateRequest request);
    SupplierResponse getSupplierById(Long id);
    SupplierResponse updateSupplier(Long id, SupplierUpdateRequest request);
    SupplierResponse deactivateSupplier(Long id);
    PageResponse<SupplierResponse> getAllSuppliers(String search, Boolean active, Pageable pageable);

    // Spare Parts Management
    PartResponse createPart(PartCreateRequest request);
    PartResponse getPartById(Long id);
    PartResponse updatePart(Long id, PartUpdateRequest request);
    PageResponse<PartResponse> getAllParts(PartCategory category, String search, Boolean lowStockOnly, Pageable pageable);
    List<PartResponse> getLowStockParts();
    PartResponse adjustStock(StockAdjustmentRequest request, String username);

    // Purchase Bills & Orders
    PurchaseInvoiceResponse createPurchaseInvoice(PurchaseInvoiceCreateRequest request, String username);
    PurchaseInvoiceResponse getPurchaseInvoiceById(Long id);
    PageResponse<PurchaseInvoiceResponse> getAllPurchaseInvoices(Long supplierId, String status, Pageable pageable);
    PurchaseInvoiceResponse postPurchaseInvoice(Long id, String username);
    PurchaseInvoiceResponse cancelPurchaseInvoice(Long id, String reason, String username);

    // Supplier Payments & Credit Accounts
    SupplierPaymentResponse recordSupplierPayment(SupplierPaymentCreateRequest request, String username);
    PageResponse<SupplierPaymentResponse> getSupplierPayments(Long supplierId, Pageable pageable);
    PageResponse<SupplierLedgerEntryResponse> getSupplierLedger(Long supplierId, Pageable pageable);
    SupplierStatementResponse getSupplierStatement(Long supplierId, LocalDate fromDate, LocalDate toDate);

    // Stock Movements
    PageResponse<StockMovementResponse> getStockMovements(Long partId, Long vehicleId, Pageable pageable);

    // Inventory Dashboard & Reports
    InventoryDashboardMetricsResponse getInventoryDashboardMetrics();
}
