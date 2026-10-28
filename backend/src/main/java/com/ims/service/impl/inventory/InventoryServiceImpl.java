package com.ims.service.impl.inventory;

import com.ims.common.PageResponse;
import com.ims.dtos.inventory.*;
import com.ims.entity.inventory.*;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.workshop.JobCardEntity;
import com.ims.enums.PartCategory;
import com.ims.enums.PaymentStatus;
import com.ims.enums.PurchaseBillStatus;
import com.ims.enums.StockMovementType;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.inventory.*;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.serviceInterface.inventory.InventoryService;
import com.ims.service.serviceInterface.inventory.StockLedgerService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final SupplierRepository supplierRepository;
    private final PartRepository partRepository;
    private final PurchaseInvoiceRepository invoiceRepository;
    private final PurchaseInvoiceItemRepository invoiceItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierPaymentRepository supplierPaymentRepository;
    private final SupplierLedgerEntryRepository supplierLedgerEntryRepository;
    private final VehicleRepository vehicleRepository;
    private final JobCardRepository jobCardRepository;
    private final StockLedgerService stockLedgerService;

    // ==========================================
    // 1. SUPPLIERS
    // ==========================================

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        String mobile = request.getMobile().trim();
        if (supplierRepository.existsByMobile(mobile)) {
            throw new DuplicateResourceException("Supplier with mobile '" + mobile + "' already exists");
        }

        String code = "SUP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        BigDecimal openingOutstanding = request.getOpeningOutstandingBalance() != null ? request.getOpeningOutstandingBalance() : BigDecimal.ZERO;
        BigDecimal openingAdvance = request.getOpeningAdvanceBalance() != null ? request.getOpeningAdvanceBalance() : BigDecimal.ZERO;
        BigDecimal creditLimit = request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO;

        SupplierEntity supplier = SupplierEntity.builder()
                .supplierCode(code)
                .name(request.getName().trim())
                .supplierType(request.getSupplierType() != null ? request.getSupplierType() : com.ims.enums.SupplierType.SPARE_PARTS)
                .contactPerson(request.getContactPerson())
                .mobile(mobile)
                .alternateContact(request.getAlternateContact())
                .email(request.getEmail())
                .gstNumber(request.getGstNumber())
                .panNumber(request.getPanNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .bankDetails(request.getBankDetails())
                .openingOutstandingBalance(openingOutstanding)
                .openingAdvanceBalance(openingAdvance)
                .creditEnabled(request.getCreditEnabled() != null ? request.getCreditEnabled() : true)
                .creditLimit(creditLimit)
                .creditPeriodDays(request.getCreditPeriodDays() != null ? request.getCreditPeriodDays() : 30)
                .paymentTerms(request.getPaymentTerms() != null ? request.getPaymentTerms() : com.ims.enums.PaymentTerms.CREDIT)
                .notes(request.getNotes())
                .active(true)
                .build();

        SupplierEntity saved = supplierRepository.save(supplier);

        // Record opening ledger balance if non-zero
        if (openingOutstanding.compareTo(BigDecimal.ZERO) > 0) {
            recordLedgerEntry(saved, LocalDate.now(), "OPENING_BALANCE", "OPN-" + saved.getSupplierCode(),
                    "Opening Outstanding Balance", BigDecimal.ZERO, openingOutstanding, openingOutstanding, "SYSTEM");
        } else if (openingAdvance.compareTo(BigDecimal.ZERO) > 0) {
            recordLedgerEntry(saved, LocalDate.now(), "OPENING_ADVANCE", "ADV-" + saved.getSupplierCode(),
                    "Opening Advance Balance", openingAdvance, BigDecimal.ZERO, openingAdvance.negate(), "SYSTEM");
        }

        return toSupplierResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        SupplierEntity supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return toSupplierResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierUpdateRequest request) {
        SupplierEntity supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        if (request.getName() != null) supplier.setName(request.getName().trim());
        if (request.getSupplierType() != null) supplier.setSupplierType(request.getSupplierType());
        if (request.getContactPerson() != null) supplier.setContactPerson(request.getContactPerson());
        if (request.getMobile() != null) supplier.setMobile(request.getMobile().trim());
        if (request.getAlternateContact() != null) supplier.setAlternateContact(request.getAlternateContact());
        if (request.getEmail() != null) supplier.setEmail(request.getEmail());
        if (request.getGstNumber() != null) supplier.setGstNumber(request.getGstNumber());
        if (request.getPanNumber() != null) supplier.setPanNumber(request.getPanNumber());
        if (request.getAddress() != null) supplier.setAddress(request.getAddress());
        if (request.getCity() != null) supplier.setCity(request.getCity());
        if (request.getState() != null) supplier.setState(request.getState());
        if (request.getPincode() != null) supplier.setPincode(request.getPincode());
        if (request.getBankDetails() != null) supplier.setBankDetails(request.getBankDetails());
        if (request.getCreditEnabled() != null) supplier.setCreditEnabled(request.getCreditEnabled());
        if (request.getCreditLimit() != null) supplier.setCreditLimit(request.getCreditLimit());
        if (request.getCreditPeriodDays() != null) supplier.setCreditPeriodDays(request.getCreditPeriodDays());
        if (request.getPaymentTerms() != null) supplier.setPaymentTerms(request.getPaymentTerms());
        if (request.getNotes() != null) supplier.setNotes(request.getNotes());
        if (request.getActive() != null) supplier.setActive(request.getActive());

        SupplierEntity updated = supplierRepository.save(supplier);
        return toSupplierResponse(updated);
    }

    @Override
    @Transactional
    public SupplierResponse deactivateSupplier(Long id) {
        SupplierEntity supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setActive(false);
        SupplierEntity updated = supplierRepository.save(supplier);
        log.info("Supplier [{}] deactivated while preserving ledger history", supplier.getName());
        return toSupplierResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> getAllSuppliers(String search, Boolean active, Pageable pageable) {
        Specification<SupplierEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchLike = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchLike);
                Predicate mobileLike = cb.like(cb.lower(root.get("mobile")), searchLike);
                Predicate codeLike = cb.like(cb.lower(root.get("supplierCode")), searchLike);
                predicates.add(cb.or(nameLike, mobileLike, codeLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<SupplierEntity> page = supplierRepository.findAll(spec, pageable);
        List<SupplierResponse> dtos = page.getContent().stream()
                .map(this::toSupplierResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    // ==========================================
    // 2. PARTS & STOCK ADJUSTMENTS
    // ==========================================

    @Override
    @Transactional
    public PartResponse createPart(PartCreateRequest request) {
        String sku = request.getSku().trim().toUpperCase();
        if (partRepository.existsBySku(sku)) {
            throw new DuplicateResourceException("Part with SKU '" + sku + "' already exists");
        }

        SupplierEntity preferredSupplier = null;
        if (request.getPreferredSupplierId() != null) {
            preferredSupplier = supplierRepository.findById(request.getPreferredSupplierId()).orElse(null);
        }

        int initialStock = request.getInitialStock() != null ? request.getInitialStock() : 0;
        int threshold = request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5;
        int reorder = request.getReorderLevel() != null ? request.getReorderLevel() : 5;

        PartEntity part = PartEntity.builder()
                .sku(sku)
                .name(request.getName().trim())
                .category(request.getCategory())
                .manufacturerBrand(request.getManufacturerBrand())
                .partNumber(request.getPartNumber())
                .compatibleVehicleType(request.getCompatibleVehicleType() != null ? request.getCompatibleVehicleType() : com.ims.enums.CompatibleVehicleType.FOUR_WHEELER)
                .compatibleModels(request.getCompatibleModels())
                .unit(request.getUnit() != null ? request.getUnit().toUpperCase() : "PCS")
                .preferredSupplier(preferredSupplier)
                .alternateSuppliers(request.getAlternateSuppliers())
                .purchasePrice(request.getPurchasePrice())
                .landedCost(request.getLandedCost() != null ? request.getLandedCost() : request.getPurchasePrice())
                .sellingPrice(request.getSellingPrice())
                .currentStock(initialStock)
                .reservedStock(0)
                .reorderLevel(reorder)
                .lowStockThreshold(threshold)
                .storageLocation(request.getStorageLocation())
                .batchOrSerialNumber(request.getBatchOrSerialNumber())
                .warrantyInfo(request.getWarrantyInfo())
                .active(true)
                .build();

        PartEntity saved = partRepository.save(part);

        if (initialStock > 0) {
            StockMovementEntity movement = StockMovementEntity.builder()
                    .part(saved)
                    .movementType(StockMovementType.PURCHASE_IN)
                    .quantity(initialStock)
                    .balanceAfter(initialStock)
                    .referenceDocument("INITIAL-STOCK")
                    .reason("Initial Opening Stock Registration")
                    .createdBy("SYSTEM")
                    .createdAt(Instant.now())
                    .build();
            stockMovementRepository.save(movement);
        }

        return toPartResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PartResponse getPartById(Long id) {
        PartEntity part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", id));
        return toPartResponse(part);
    }

    @Override
    @Transactional
    public PartResponse updatePart(Long id, PartUpdateRequest request) {
        PartEntity part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", id));

        if (request.getName() != null) part.setName(request.getName().trim());
        if (request.getCategory() != null) part.setCategory(request.getCategory());
        if (request.getManufacturerBrand() != null) part.setManufacturerBrand(request.getManufacturerBrand());
        if (request.getPartNumber() != null) part.setPartNumber(request.getPartNumber());
        if (request.getCompatibleVehicleType() != null) part.setCompatibleVehicleType(request.getCompatibleVehicleType());
        if (request.getCompatibleModels() != null) part.setCompatibleModels(request.getCompatibleModels());
        if (request.getUnit() != null) part.setUnit(request.getUnit().toUpperCase());
        if (request.getPreferredSupplierId() != null) {
            SupplierEntity sup = supplierRepository.findById(request.getPreferredSupplierId()).orElse(null);
            part.setPreferredSupplier(sup);
        }
        if (request.getAlternateSuppliers() != null) part.setAlternateSuppliers(request.getAlternateSuppliers());
        if (request.getPurchasePrice() != null) part.setPurchasePrice(request.getPurchasePrice());
        if (request.getLandedCost() != null) part.setLandedCost(request.getLandedCost());
        if (request.getSellingPrice() != null) part.setSellingPrice(request.getSellingPrice());
        if (request.getReorderLevel() != null) part.setReorderLevel(request.getReorderLevel());
        if (request.getLowStockThreshold() != null) part.setLowStockThreshold(request.getLowStockThreshold());
        if (request.getStorageLocation() != null) part.setStorageLocation(request.getStorageLocation());
        if (request.getBatchOrSerialNumber() != null) part.setBatchOrSerialNumber(request.getBatchOrSerialNumber());
        if (request.getWarrantyInfo() != null) part.setWarrantyInfo(request.getWarrantyInfo());
        if (request.getActive() != null) part.setActive(request.getActive());

        PartEntity updated = partRepository.save(part);
        return toPartResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PartResponse> getAllParts(PartCategory category, String search, Boolean lowStockOnly, Pageable pageable) {
        Specification<PartEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (Boolean.TRUE.equals(lowStockOnly)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentStock"), root.get("lowStockThreshold")));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchLike = "%" + search.trim().toLowerCase() + "%";
                Predicate skuLike = cb.like(cb.lower(root.get("sku")), searchLike);
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchLike);
                Predicate brandLike = cb.like(cb.lower(root.get("manufacturerBrand")), searchLike);
                Predicate partNoLike = cb.like(cb.lower(root.get("partNumber")), searchLike);
                predicates.add(cb.or(skuLike, nameLike, brandLike, partNoLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PartEntity> page = partRepository.findAll(spec, pageable);
        List<PartResponse> dtos = page.getContent().stream()
                .map(this::toPartResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartResponse> getLowStockParts() {
        return partRepository.findLowStockParts().stream()
                .map(this::toPartResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public synchronized PartResponse adjustStock(StockAdjustmentRequest request, String username) {
        PartEntity part = partRepository.findByIdForUpdate(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", request.getPartId()));

        int newStock = part.getCurrentStock() + request.getQuantity();
        if (newStock < 0) {
            throw new BusinessRuleViolationException("Stock cannot be reduced below zero. Current stock: " + part.getCurrentStock());
        }

        part.setCurrentStock(newStock);
        PartEntity savedPart = partRepository.save(part);

        VehicleEntity vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        }

        StockMovementEntity movement = StockMovementEntity.builder()
                .part(savedPart)
                .movementType(StockMovementType.ADJUSTMENT)
                .quantity(request.getQuantity())
                .balanceAfter(newStock)
                .referenceDocument("ADJ-" + LocalDate.now().toString())
                .vehicle(vehicle)
                .reason(request.getReason())
                .createdBy(username != null ? username : "SYSTEM")
                .createdAt(Instant.now())
                .build();
        stockMovementRepository.save(movement);

        return toPartResponse(savedPart);
    }

    // ==========================================
    // 3. PURCHASE BILLS & ORDERS
    // ==========================================

    @Override
    @Transactional
    public PurchaseInvoiceResponse createPurchaseInvoice(PurchaseInvoiceCreateRequest request, String username) {
        SupplierEntity supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

        if (!supplier.isActive()) {
            throw new BusinessRuleViolationException("Cannot purchase from deactivated supplier: " + supplier.getName());
        }

        // Prevent duplicate supplier invoices
        if (request.getSupplierInvoiceNumber() != null && !request.getSupplierInvoiceNumber().trim().isEmpty()) {
            if (invoiceRepository.existsBySupplierIdAndSupplierInvoiceNumber(supplier.getId(), request.getSupplierInvoiceNumber().trim())) {
                throw new DuplicateResourceException("Supplier invoice '" + request.getSupplierInvoiceNumber().trim() +
                        "' from " + supplier.getName() + " is already recorded.");
            }
        }

        String invoiceNo = request.getInvoiceNumber();
        if (invoiceNo == null || invoiceNo.trim().isEmpty()) {
            invoiceNo = "PO-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        if (invoiceRepository.existsByInvoiceNumber(invoiceNo)) {
            throw new DuplicateResourceException("Purchase invoice number '" + invoiceNo + "' already exists");
        }

        VehicleEntity vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        }

        JobCardEntity jobCard = null;
        if (request.getJobCardId() != null) {
            jobCard = jobCardRepository.findById(request.getJobCardId()).orElse(null);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<PurchaseInvoiceItemEntity> items = new ArrayList<>();
        PurchaseInvoiceEntity invoice = PurchaseInvoiceEntity.builder()
                .invoiceNumber(invoiceNo)
                .supplierInvoiceNumber(request.getSupplierInvoiceNumber() != null ? request.getSupplierInvoiceNumber().trim() : null)
                .supplier(supplier)
                .invoiceDate(request.getInvoiceDate())
                .purchaseDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : request.getInvoiceDate())
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .branchWarehouse(request.getBranchWarehouse())
                .vehicle(vehicle)
                .jobCard(jobCard)
                .status(PurchaseBillStatus.DRAFT)
                .notes(request.getNotes())
                .documentPath(request.getDocumentPath())
                .createdByUser(username)
                .build();

        // Calculate line subtotals and taxes
        for (PurchaseInvoiceCreateRequest.InvoiceItemRequest itemReq : request.getItems()) {
            PartEntity part = partRepository.findById(itemReq.getPartId())
                    .orElseThrow(() -> new ResourceNotFoundException("Part", "id", itemReq.getPartId()));

            BigDecimal lineGross = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineDiscount = itemReq.getLineDiscount() != null ? itemReq.getLineDiscount() : BigDecimal.ZERO;
            BigDecimal lineNet = lineGross.subtract(lineDiscount);

            BigDecimal taxRate = itemReq.getTaxPercentage() != null ? itemReq.getTaxPercentage() : BigDecimal.ZERO;
            BigDecimal lineTax = lineNet.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineNet.add(lineTax);

            subtotal = subtotal.add(lineNet);
            totalTax = totalTax.add(lineTax);

            PurchaseInvoiceItemEntity item = PurchaseInvoiceItemEntity.builder()
                    .invoice(invoice)
                    .part(part)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .lineDiscount(lineDiscount)
                    .taxPercentage(taxRate)
                    .taxAmount(lineTax)
                    .totalAmount(lineTotal)
                    .build();

            items.add(item);
        }

        BigDecimal invoiceDiscount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal freight = request.getFreightCharge() != null ? request.getFreightCharge() : BigDecimal.ZERO;
        BigDecimal otherCharges = request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO;

        BigDecimal totalAmount = subtotal.add(totalTax).add(freight).add(otherCharges).subtract(invoiceDiscount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // Allocate freight & other charges to line items as landed cost
        BigDecimal totalLandedAllocated = freight.add(otherCharges);
        if (totalLandedAllocated.compareTo(BigDecimal.ZERO) > 0 && subtotal.compareTo(BigDecimal.ZERO) > 0) {
            for (PurchaseInvoiceItemEntity item : items) {
                BigDecimal proportion = item.getTotalAmount().divide(totalAmount, 4, RoundingMode.HALF_UP);
                item.setLandedCostAllocation(totalLandedAllocated.multiply(proportion).setScale(2, RoundingMode.HALF_UP));
            }
        }

        invoice.setSubtotalAmount(subtotal);
        invoice.setDiscountAmount(invoiceDiscount);
        invoice.setTaxAmount(totalTax);
        invoice.setFreightCharge(freight);
        invoice.setOtherCharges(otherCharges);
        invoice.setTotalAmount(totalAmount);
        invoice.setItems(items);

        // Due date based on payment terms
        int creditDays = supplier.getCreditPeriodDays() != null ? supplier.getCreditPeriodDays() : 30;
        invoice.setDueDate(request.getInvoiceDate().plusDays(creditDays));

        // Initial payment handling (Full, Partial, or Credit)
        BigDecimal amountPaid = request.getAmountPaidNow() != null ? request.getAmountPaidNow() : BigDecimal.ZERO;
        if (amountPaid.compareTo(totalAmount) > 0) {
            throw new BusinessRuleViolationException("Paid amount cannot exceed invoice total: ₹" + totalAmount);
        }

        invoice.setAmountPaid(amountPaid);
        BigDecimal outstanding = totalAmount.subtract(amountPaid);
        invoice.setAmountOutstanding(outstanding);

        if (outstanding.compareTo(BigDecimal.ZERO) == 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
        } else if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        } else {
            invoice.setPaymentStatus(PaymentStatus.UNPAID);
        }

        PurchaseInvoiceEntity saved = invoiceRepository.save(invoice);

        // If upfront payment was made, record payment transaction
        if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            String payCode = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            SupplierPaymentEntity payment = SupplierPaymentEntity.builder()
                    .paymentCode(payCode)
                    .supplier(supplier)
                    .invoice(saved)
                    .paymentDate(request.getInvoiceDate())
                    .amount(amountPaid)
                    .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : com.ims.enums.PaymentMethod.BANK_TRANSFER)
                    .transactionReference(request.getPaymentReference())
                    .advance(false)
                    .unallocatedAmount(BigDecimal.ZERO)
                    .branchWarehouse(request.getBranchWarehouse())
                    .notes("Upfront settlement for purchase " + saved.getInvoiceNumber())
                    .createdByUser(username)
                    .build();
            supplierPaymentRepository.save(payment);
        }

        return toInvoiceResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseInvoiceResponse getPurchaseInvoiceById(Long id) {
        PurchaseInvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseInvoice", "id", id));
        return toInvoiceResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PurchaseInvoiceResponse> getAllPurchaseInvoices(Long supplierId, String status, Pageable pageable) {
        Specification<PurchaseInvoiceEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), PurchaseBillStatus.valueOf(status.trim().toUpperCase())));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PurchaseInvoiceEntity> page = invoiceRepository.findAll(spec, pageable);
        List<PurchaseInvoiceResponse> dtos = page.getContent().stream()
                .map(this::toInvoiceResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional
    public PurchaseInvoiceResponse postPurchaseInvoice(Long id, String username) {
        PurchaseInvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseInvoice", "id", id));

        if (invoice.getStatus() == PurchaseBillStatus.POSTED) {
            throw new BusinessRuleViolationException("Purchase invoice '" + invoice.getInvoiceNumber() + "' is already posted");
        }

        SupplierEntity supplier = invoice.getSupplier();

        // Check Credit Limit policy for unpaid / credit portions
        if (Boolean.TRUE.equals(supplier.getCreditEnabled()) && supplier.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentOutstanding = invoiceRepository.sumOutstandingBySupplierIdAndStatus(supplier.getId(), PurchaseBillStatus.POSTED);
            BigDecimal newTotalOutstanding = currentOutstanding.add(invoice.getAmountOutstanding());
            if (newTotalOutstanding.compareTo(supplier.getCreditLimit()) > 0) {
                log.warn("Credit limit warning for supplier [{}]: Limit=₹{}, Proposed Outstanding=₹{}",
                        supplier.getName(), supplier.getCreditLimit(), newTotalOutstanding);
            }
        }

        // Increase physical stock for every line item
        for (PurchaseInvoiceItemEntity item : invoice.getItems()) {
            stockLedgerService.recordStockIn(
                    item.getPart().getId(),
                    item.getQuantity(),
                    invoice.getInvoiceNumber(),
                    "Purchase Invoice Stock In: " + invoice.getInvoiceNumber(),
                    username
            );

            // Update weighted average purchase price and landed cost
            PartEntity part = item.getPart();
            part.setPurchasePrice(item.getUnitPrice());
            if (item.getLandedCostAllocation() != null && item.getQuantity() > 0) {
                BigDecimal unitLanded = item.getUnitPrice().add(
                        item.getLandedCostAllocation().divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP)
                );
                part.setLandedCost(unitLanded);
            }
            partRepository.save(part);
        }

        // Update Supplier Ledger: Credit amount (increases payable)
        BigDecimal currentBalance = getSupplierRunningBalance(supplier.getId());
        BigDecimal newBalance = currentBalance.add(invoice.getTotalAmount());

        recordLedgerEntry(
                supplier,
                invoice.getInvoiceDate(),
                "PURCHASE_INVOICE",
                invoice.getInvoiceNumber(),
                "Purchase Invoice posted (" + invoice.getInvoiceNumber() + ")",
                BigDecimal.ZERO,
                invoice.getTotalAmount(),
                newBalance,
                username
        );

        // If upfront payment was made, also record debit entry in ledger
        if (invoice.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            newBalance = newBalance.subtract(invoice.getAmountPaid());
            recordLedgerEntry(
                    supplier,
                    invoice.getInvoiceDate(),
                    "PAYMENT",
                    "PAY-" + invoice.getInvoiceNumber(),
                    "Upfront Payment for " + invoice.getInvoiceNumber(),
                    invoice.getAmountPaid(),
                    BigDecimal.ZERO,
                    newBalance,
                    username
            );
        }

        invoice.setStatus(PurchaseBillStatus.POSTED);
        invoice.setPostedAt(Instant.now());
        PurchaseInvoiceEntity saved = invoiceRepository.save(invoice);
        log.info("Successfully posted purchase invoice [{}] for supplier [{}] by user [{}]",
                invoice.getInvoiceNumber(), supplier.getName(), username);

        return toInvoiceResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseInvoiceResponse cancelPurchaseInvoice(Long id, String reason, String username) {
        PurchaseInvoiceEntity invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseInvoice", "id", id));

        if (invoice.getStatus() == PurchaseBillStatus.POSTED) {
            throw new BusinessRuleViolationException("Cannot directly cancel a POSTED purchase invoice. Please issue a purchase return / credit note instead.");
        }

        invoice.setStatus(PurchaseBillStatus.CANCELLED);
        invoice.setNotes((invoice.getNotes() != null ? invoice.getNotes() + " | " : "") + "Cancelled: " + reason);
        PurchaseInvoiceEntity saved = invoiceRepository.save(invoice);
        log.info("Cancelled draft purchase invoice [{}] by user [{}]", invoice.getInvoiceNumber(), username);
        return toInvoiceResponse(saved);
    }

    // ==========================================
    // 4. SUPPLIER PAYMENTS & CREDIT ACCOUNTS
    // ==========================================

    @Override
    @Transactional
    public SupplierPaymentResponse recordSupplierPayment(SupplierPaymentCreateRequest request, String username) {
        SupplierEntity supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

        PurchaseInvoiceEntity invoice = null;
        BigDecimal unallocated = BigDecimal.ZERO;

        if (request.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(request.getInvoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("PurchaseInvoice", "id", request.getInvoiceId()));

            if (invoice.getAmountOutstanding().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleViolationException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
            }

            if (request.getAmount().compareTo(invoice.getAmountOutstanding()) > 0) {
                // Excess recorded as advance credit
                unallocated = request.getAmount().subtract(invoice.getAmountOutstanding());
                invoice.setAmountPaid(invoice.getTotalAmount());
                invoice.setAmountOutstanding(BigDecimal.ZERO);
                invoice.setPaymentStatus(PaymentStatus.PAID);
            } else {
                invoice.setAmountPaid(invoice.getAmountPaid().add(request.getAmount()));
                invoice.setAmountOutstanding(invoice.getAmountOutstanding().subtract(request.getAmount()));
                if (invoice.getAmountOutstanding().compareTo(BigDecimal.ZERO) == 0) {
                    invoice.setPaymentStatus(PaymentStatus.PAID);
                } else {
                    invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
                }
            }
            invoiceRepository.save(invoice);
        } else {
            // General Supplier Advance
            unallocated = request.getAmount();
        }

        String paymentCode = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        SupplierPaymentEntity payment = SupplierPaymentEntity.builder()
                .paymentCode(paymentCode)
                .supplier(supplier)
                .invoice(invoice)
                .paymentDate(request.getPaymentDate())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .advance(Boolean.TRUE.equals(request.getIsAdvance()) || invoice == null)
                .unallocatedAmount(unallocated)
                .branchWarehouse(request.getBranchWarehouse())
                .notes(request.getNotes())
                .createdByUser(username)
                .build();

        SupplierPaymentEntity saved = supplierPaymentRepository.save(payment);

        // Update Supplier Ledger: Debit amount (decreases payable)
        BigDecimal currentBalance = getSupplierRunningBalance(supplier.getId());
        BigDecimal newBalance = currentBalance.subtract(request.getAmount());

        recordLedgerEntry(
                supplier,
                request.getPaymentDate(),
                invoice != null ? "PAYMENT" : "ADVANCE_PAYMENT",
                paymentCode,
                invoice != null ? ("Payment for " + invoice.getInvoiceNumber()) : "Supplier Advance Payment",
                request.getAmount(),
                BigDecimal.ZERO,
                newBalance,
                username
        );

        return toPaymentResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierPaymentResponse> getSupplierPayments(Long supplierId, Pageable pageable) {
        Page<SupplierPaymentEntity> page;
        if (supplierId != null) {
            page = supplierPaymentRepository.findBySupplierId(supplierId, pageable);
        } else {
            page = supplierPaymentRepository.findAll(pageable);
        }
        List<SupplierPaymentResponse> dtos = page.getContent().stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());
        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierLedgerEntryResponse> getSupplierLedger(Long supplierId, Pageable pageable) {
        Page<SupplierLedgerEntryEntity> page = supplierLedgerEntryRepository.findBySupplierIdOrderByEntryDateDescIdDesc(supplierId, pageable);
        List<SupplierLedgerEntryResponse> dtos = page.getContent().stream()
                .map(this::toLedgerResponse)
                .collect(Collectors.toList());
        return PageResponse.of(page, dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierStatementResponse getSupplierStatement(Long supplierId, LocalDate fromDate, LocalDate toDate) {
        SupplierEntity supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", supplierId));

        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        List<SupplierLedgerEntryEntity> allEntries = supplierLedgerEntryRepository.findBySupplierIdOrderByEntryDateAscIdAsc(supplierId);

        BigDecimal openingBalance = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        List<SupplierLedgerEntryResponse> periodEntries = new ArrayList<>();

        for (SupplierLedgerEntryEntity e : allEntries) {
            if (e.getEntryDate().isBefore(start)) {
                openingBalance = openingBalance.add(e.getCreditAmount()).subtract(e.getDebitAmount());
            } else if (!e.getEntryDate().isAfter(end)) {
                totalDebits = totalDebits.add(e.getDebitAmount());
                totalCredits = totalCredits.add(e.getCreditAmount());
                periodEntries.add(toLedgerResponse(e));
            }
        }

        BigDecimal closingBalance = openingBalance.add(totalCredits).subtract(totalDebits);

        return SupplierStatementResponse.builder()
                .supplierId(supplier.getId())
                .supplierCode(supplier.getSupplierCode())
                .supplierName(supplier.getName())
                .fromDate(start)
                .toDate(end)
                .openingBalance(openingBalance)
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .closingBalance(closingBalance)
                .entries(periodEntries)
                .build();
    }

    // ==========================================
    // 5. STOCK MOVEMENTS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> getStockMovements(Long partId, Long vehicleId, Pageable pageable) {
        Specification<StockMovementEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (partId != null) {
                predicates.add(cb.equal(root.get("part").get("id"), partId));
            }
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<StockMovementEntity> page = stockMovementRepository.findAll(spec, pageable);
        List<StockMovementResponse> dtos = page.getContent().stream()
                .map(this::toStockMovementResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    // ==========================================
    // 6. INVENTORY DASHBOARD METRICS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public InventoryDashboardMetricsResponse getInventoryDashboardMetrics() {
        long vehiclesInStock = vehicleRepository.countByStatus(com.ims.enums.VehicleStatus.AVAILABLE);
        long partsCount = partRepository.count();
        long lowStockCount = partRepository.countLowStockParts();
        BigDecimal partsValuation = partRepository.sumInventoryValuation();

        BigDecimal supplierOutstanding = invoiceRepository.sumTotalOutstandingAcrossSuppliers();
        BigDecimal overdueBills = invoiceRepository.sumOverdueAcrossSuppliers(LocalDate.now());

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        BigDecimal purchasesThisMonth = invoiceRepository.sumPurchasesSince(startOfMonth);

        // Approximate credit utilization
        BigDecimal totalCreditLimit = BigDecimal.ZERO;
        List<SupplierEntity> suppliers = supplierRepository.findAll();
        for (SupplierEntity s : suppliers) {
            if (Boolean.TRUE.equals(s.getCreditEnabled()) && s.getCreditLimit() != null) {
                totalCreditLimit = totalCreditLimit.add(s.getCreditLimit());
            }
        }

        BigDecimal utilizationRate = BigDecimal.ZERO;
        if (totalCreditLimit.compareTo(BigDecimal.ZERO) > 0) {
            utilizationRate = supplierOutstanding.multiply(BigDecimal.valueOf(100)).divide(totalCreditLimit, 2, RoundingMode.HALF_UP);
        }

        return InventoryDashboardMetricsResponse.builder()
                .totalVehiclesInStock(vehiclesInStock)
                .totalSparePartsItems(partsCount)
                .lowStockItemsCount(lowStockCount)
                .sparePartsValuation(partsValuation)
                .vehicleInventoryValuation(BigDecimal.ZERO)
                .totalSupplierOutstanding(supplierOutstanding)
                .overdueSupplierBills(overdueBills)
                .supplierCreditUtilizationRate(utilizationRate)
                .partsPurchasesThisMonth(purchasesThisMonth)
                .vehicleRefurbishmentCosts(BigDecimal.ZERO)
                .estimatedVehicleGrossProfit(BigDecimal.ZERO)
                .soldVehicleGrossProfit(BigDecimal.ZERO)
                .build();
    }

    // ==========================================
    // HELPER UTILITIES & MAPPERS
    // ==========================================

    private BigDecimal getSupplierRunningBalance(Long supplierId) {
        return supplierLedgerEntryRepository.findLatestBySupplierId(supplierId)
                .map(SupplierLedgerEntryEntity::getRunningBalance)
                .orElse(BigDecimal.ZERO);
    }

    private void recordLedgerEntry(SupplierEntity supplier, LocalDate date, String refType, String refNo,
                                   String description, BigDecimal debit, BigDecimal credit, BigDecimal runningBal, String user) {
        SupplierLedgerEntryEntity entry = SupplierLedgerEntryEntity.builder()
                .supplier(supplier)
                .entryDate(date)
                .referenceType(refType)
                .referenceNumber(refNo)
                .description(description)
                .debitAmount(debit != null ? debit : BigDecimal.ZERO)
                .creditAmount(credit != null ? credit : BigDecimal.ZERO)
                .runningBalance(runningBal != null ? runningBal : BigDecimal.ZERO)
                .createdByUser(user != null ? user : "SYSTEM")
                .build();
        supplierLedgerEntryRepository.save(entry);
    }

    private SupplierResponse toSupplierResponse(SupplierEntity entity) {
        BigDecimal totalPurchases = invoiceRepository.sumTotalBySupplierIdAndStatus(entity.getId(), PurchaseBillStatus.POSTED);
        if (totalPurchases == null) totalPurchases = BigDecimal.ZERO;

        BigDecimal totalPayments = supplierPaymentRepository.sumPaymentsBySupplierId(entity.getId());
        if (totalPayments == null) totalPayments = BigDecimal.ZERO;

        BigDecimal outstanding = invoiceRepository.sumOutstandingBySupplierIdAndStatus(entity.getId(), PurchaseBillStatus.POSTED);
        if (outstanding == null) outstanding = BigDecimal.ZERO;

        BigDecimal creditLimit = entity.getCreditLimit() != null ? entity.getCreditLimit() : BigDecimal.ZERO;
        BigDecimal availableCredit = creditLimit.subtract(outstanding);
        if (availableCredit.compareTo(BigDecimal.ZERO) < 0) availableCredit = BigDecimal.ZERO;

        return SupplierResponse.builder()
                .id(entity.getId())
                .supplierCode(entity.getSupplierCode())
                .name(entity.getName())
                .supplierType(entity.getSupplierType())
                .contactPerson(entity.getContactPerson())
                .mobile(entity.getMobile())
                .alternateContact(entity.getAlternateContact())
                .email(entity.getEmail())
                .gstNumber(entity.getGstNumber())
                .panNumber(entity.getPanNumber())
                .address(entity.getAddress())
                .city(entity.getCity())
                .state(entity.getState())
                .pincode(entity.getPincode())
                .bankDetails(entity.getBankDetails())
                .openingOutstandingBalance(entity.getOpeningOutstandingBalance())
                .openingAdvanceBalance(entity.getOpeningAdvanceBalance())
                .creditEnabled(entity.getCreditEnabled())
                .creditLimit(creditLimit)
                .creditPeriodDays(entity.getCreditPeriodDays())
                .paymentTerms(entity.getPaymentTerms())
                .notes(entity.getNotes())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .totalPurchases(totalPurchases)
                .totalPayments(totalPayments)
                .outstandingAmount(outstanding)
                .overdueAmount(BigDecimal.ZERO)
                .availableCredit(availableCredit)
                .build();
    }

    private PartResponse toPartResponse(PartEntity entity) {
        boolean isLow = entity.getCurrentStock() <= entity.getLowStockThreshold();
        return PartResponse.builder()
                .id(entity.getId())
                .sku(entity.getSku())
                .name(entity.getName())
                .category(entity.getCategory())
                .manufacturerBrand(entity.getManufacturerBrand())
                .partNumber(entity.getPartNumber())
                .compatibleVehicleType(entity.getCompatibleVehicleType())
                .compatibleModels(entity.getCompatibleModels())
                .unit(entity.getUnit())
                .preferredSupplierId(entity.getPreferredSupplier() != null ? entity.getPreferredSupplier().getId() : null)
                .preferredSupplierName(entity.getPreferredSupplier() != null ? entity.getPreferredSupplier().getName() : null)
                .alternateSuppliers(entity.getAlternateSuppliers())
                .purchasePrice(entity.getPurchasePrice())
                .landedCost(entity.getLandedCost())
                .sellingPrice(entity.getSellingPrice())
                .currentStock(entity.getCurrentStock())
                .reservedStock(entity.getReservedStock() != null ? entity.getReservedStock() : 0)
                .availableStock(entity.getAvailableStock())
                .reorderLevel(entity.getReorderLevel() != null ? entity.getReorderLevel() : 5)
                .lowStockThreshold(entity.getLowStockThreshold())
                .storageLocation(entity.getStorageLocation())
                .batchOrSerialNumber(entity.getBatchOrSerialNumber())
                .warrantyInfo(entity.getWarrantyInfo())
                .lowStock(isLow)
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private PurchaseInvoiceResponse toInvoiceResponse(PurchaseInvoiceEntity entity) {
        List<PurchaseInvoiceResponse.InvoiceItemDto> itemDtos = entity.getItems() == null ? Collections.emptyList() :
                entity.getItems().stream().map(i -> PurchaseInvoiceResponse.InvoiceItemDto.builder()
                        .id(i.getId())
                        .partId(i.getPart().getId())
                        .partSku(i.getPart().getSku())
                        .partName(i.getPart().getName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineDiscount(i.getLineDiscount())
                        .taxPercentage(i.getTaxPercentage())
                        .taxAmount(i.getTaxAmount())
                        .landedCostAllocation(i.getLandedCostAllocation())
                        .totalAmount(i.getTotalAmount())
                        .build()
                ).collect(Collectors.toList());

        return PurchaseInvoiceResponse.builder()
                .id(entity.getId())
                .invoiceNumber(entity.getInvoiceNumber())
                .supplierInvoiceNumber(entity.getSupplierInvoiceNumber())
                .supplierId(entity.getSupplier().getId())
                .supplierName(entity.getSupplier().getName())
                .supplierCode(entity.getSupplier().getSupplierCode())
                .invoiceDate(entity.getInvoiceDate())
                .purchaseDate(entity.getPurchaseDate())
                .expectedDeliveryDate(entity.getExpectedDeliveryDate())
                .dueDate(entity.getDueDate())
                .branchWarehouse(entity.getBranchWarehouse())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehicleRegistrationNumber(entity.getVehicle() != null ? entity.getVehicle().getRegistrationNumber() : null)
                .jobCardId(entity.getJobCard() != null ? entity.getJobCard().getId() : null)
                .jobCardNumber(entity.getJobCard() != null ? entity.getJobCard().getJobCardNumber() : null)
                .subtotalAmount(entity.getSubtotalAmount())
                .discountAmount(entity.getDiscountAmount())
                .taxAmount(entity.getTaxAmount())
                .freightCharge(entity.getFreightCharge())
                .otherCharges(entity.getOtherCharges())
                .totalAmount(entity.getTotalAmount())
                .amountPaid(entity.getAmountPaid())
                .amountOutstanding(entity.getAmountOutstanding())
                .status(entity.getStatus())
                .paymentStatus(entity.getPaymentStatus())
                .documentPath(entity.getDocumentPath())
                .notes(entity.getNotes())
                .postedAt(entity.getPostedAt())
                .createdByUser(entity.getCreatedByUser())
                .items(itemDtos)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private SupplierPaymentResponse toPaymentResponse(SupplierPaymentEntity entity) {
        return SupplierPaymentResponse.builder()
                .id(entity.getId())
                .paymentCode(entity.getPaymentCode())
                .supplierId(entity.getSupplier().getId())
                .supplierName(entity.getSupplier().getName())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .invoiceNumber(entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null)
                .paymentDate(entity.getPaymentDate())
                .amount(entity.getAmount())
                .paymentMethod(entity.getPaymentMethod())
                .transactionReference(entity.getTransactionReference())
                .isAdvance(entity.isAdvance())
                .unallocatedAmount(entity.getUnallocatedAmount())
                .branchWarehouse(entity.getBranchWarehouse())
                .notes(entity.getNotes())
                .createdByUser(entity.getCreatedByUser())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private SupplierLedgerEntryResponse toLedgerResponse(SupplierLedgerEntryEntity entity) {
        return SupplierLedgerEntryResponse.builder()
                .id(entity.getId())
                .supplierId(entity.getSupplier().getId())
                .supplierName(entity.getSupplier().getName())
                .entryDate(entity.getEntryDate())
                .referenceType(entity.getReferenceType())
                .referenceNumber(entity.getReferenceNumber())
                .description(entity.getDescription())
                .debitAmount(entity.getDebitAmount())
                .creditAmount(entity.getCreditAmount())
                .runningBalance(entity.getRunningBalance())
                .createdByUser(entity.getCreatedByUser())
                .build();
    }

    private StockMovementResponse toStockMovementResponse(StockMovementEntity entity) {
        return StockMovementResponse.builder()
                .id(entity.getId())
                .partId(entity.getPart().getId())
                .partSku(entity.getPart().getSku())
                .partName(entity.getPart().getName())
                .movementType(entity.getMovementType())
                .quantity(entity.getQuantity())
                .balanceAfter(entity.getBalanceAfter())
                .referenceDocument(entity.getReferenceDocument())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehicleRegistrationNumber(entity.getVehicle() != null ? entity.getVehicle().getRegistrationNumber() : null)
                .reason(entity.getReason())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
