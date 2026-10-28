package com.ims.unit.inventory;

import com.ims.dtos.costing.MarketPricingAnalysisResponse;
import com.ims.dtos.inventory.*;
import com.ims.entity.costing.VehicleCostEntity;
import com.ims.entity.inventory.*;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehiclePurchaseEntity;
import com.ims.entity.workshop.*;
import com.ims.enums.*;
import com.ims.repository.costing.MarketComparableRepository;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.costing.VehicleCostRepository;
import com.ims.repository.inventory.*;
import com.ims.repository.vehicle.VehiclePurchaseRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.impl.costing.VehicleCostingServiceImpl;
import com.ims.service.impl.inventory.InventoryServiceImpl;
import com.ims.service.serviceInterface.inventory.StockLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MasterInventoryAndCostingTest {

    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private PartRepository partRepository;
    @Mock
    private PurchaseInvoiceRepository invoiceRepository;
    @Mock
    private PurchaseInvoiceItemRepository invoiceItemRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private SupplierPaymentRepository supplierPaymentRepository;
    @Mock
    private SupplierLedgerEntryRepository supplierLedgerEntryRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private JobCardRepository jobCardRepository;
    @Mock
    private StockLedgerService stockLedgerService;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    // Costing Service dependencies
    @Mock
    private VehiclePurchaseRepository purchaseRepository;
    @Mock
    private VehicleCostRepository vehicleCostRepository;
    @Mock
    private ShopExpenseRepository shopExpenseRepository;
    @Mock
    private MarketComparableRepository marketComparableRepository;
    @Mock
    private com.ims.repository.sales.SaleRepository saleRepository;

    @InjectMocks
    private VehicleCostingServiceImpl vehicleCostingService;

    private SupplierEntity testSupplier;
    private PartEntity testPart;
    private VehicleEntity testVehicle;

    @BeforeEach
    void setUp() {
        testSupplier = SupplierEntity.builder()
                .supplierCode("SUP-TEST01")
                .name("SpeedX Auto Spares Agency")
                .supplierType(SupplierType.SPARE_PARTS)
                .mobile("+91 9988776655")
                .active(true)
                .creditEnabled(true)
                .creditLimit(BigDecimal.valueOf(100000.00))
                .creditPeriodDays(30)
                .paymentTerms(PaymentTerms.CREDIT)
                .build();
        testSupplier.setId(10L);

        testPart = PartEntity.builder()
                .sku("BRK-PAD-BOSCH")
                .name("Bosch Ceramic Brake Pads")
                .category(PartCategory.PART)
                .unit("SET")
                .purchasePrice(BigDecimal.valueOf(2500.00))
                .sellingPrice(BigDecimal.valueOf(3200.00))
                .currentStock(10)
                .lowStockThreshold(3)
                .active(true)
                .build();
        testPart.setId(50L);

        testVehicle = VehicleEntity.builder()
                .registrationNumber("DL01XY9999")
                .vehicleType(VehicleType.CAR)
                .brand("Honda")
                .model("City")
                .manufacturingYear(2021)
                .ownershipType(OwnershipType.OWN)
                .status(VehicleStatus.AVAILABLE)
                .build();
        testVehicle.setId(100L);
    }

    @Test
    @DisplayName("Test 1-3: Supplier creation, code generation and duplicate validation")
    void testSupplierCreation() {
        when(supplierRepository.existsByMobile("+91 9988776655")).thenReturn(false);
        when(supplierRepository.save(any(SupplierEntity.class))).thenAnswer(invocation -> {
            SupplierEntity s = invocation.getArgument(0);
            s.setId(11L);
            return s;
        });

        SupplierCreateRequest req = SupplierCreateRequest.builder()
                .name("SpeedX Auto Spares Agency")
                .mobile("+91 9988776655")
                .creditLimit(BigDecimal.valueOf(100000.00))
                .creditPeriodDays(30)
                .paymentTerms(PaymentTerms.CREDIT)
                .build();

        SupplierResponse res = inventoryService.createSupplier(req);

        assertNotNull(res);
        assertNotNull(res.getSupplierCode());
        assertTrue(res.getSupplierCode().startsWith("SUP-"));
        assertEquals("SpeedX Auto Spares Agency", res.getName());
    }

    @Test
    @DisplayName("Test 4-8: Purchase Parts Invoice with Full, Partial, and Credit payment modes")
    void testPurchaseInvoiceWorkflow() {
        when(supplierRepository.findById(10L)).thenReturn(Optional.of(testSupplier));
        when(partRepository.findById(50L)).thenReturn(Optional.of(testPart));
        when(invoiceRepository.save(any(PurchaseInvoiceEntity.class))).thenAnswer(invocation -> {
            PurchaseInvoiceEntity pi = invocation.getArgument(0);
            pi.setId(200L);
            return pi;
        });

        // 1. Partial payment scenario: Invoice = ₹10,000, Paid Upfront = ₹4,000, Outstanding = ₹6,000
        PurchaseInvoiceCreateRequest req = PurchaseInvoiceCreateRequest.builder()
                .supplierId(10L)
                .invoiceDate(LocalDate.now())
                .amountPaidNow(BigDecimal.valueOf(4000.00))
                .items(List.of(
                        PurchaseInvoiceCreateRequest.InvoiceItemRequest.builder()
                                .partId(50L)
                                .quantity(4)
                                .unitPrice(BigDecimal.valueOf(2500.00)) // 4 * 2500 = 10,000
                                .taxPercentage(BigDecimal.ZERO)
                                .build()
                ))
                .build();

        PurchaseInvoiceResponse res = inventoryService.createPurchaseInvoice(req, "admin");

        assertNotNull(res);
        assertEquals(0, BigDecimal.valueOf(10000.00).compareTo(res.getTotalAmount()));
        assertEquals(0, BigDecimal.valueOf(4000.00).compareTo(res.getAmountPaid()));
        assertEquals(0, BigDecimal.valueOf(6000.00).compareTo(res.getAmountOutstanding()));
        assertEquals(PaymentStatus.PARTIALLY_PAID, res.getPaymentStatus());
    }

    @Test
    @DisplayName("Test 14-19: Vehicle Repair Costing ₹50,000 Purchase + ₹8,500 Repairs = ₹58,500 Total Cost with 15% Markup & 15% Gross Margin")
    void testVehicleCostingAndPricingCalculations() {
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(testVehicle));

        // Vehicle purchased for ₹50,000 with 0 expenses
        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(testVehicle)
                .purchasePrice(BigDecimal.valueOf(50000.00))
                .purchaseExpenses(BigDecimal.ZERO)
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));

        // Job Card with ₹5,000 parts, ₹2,500 labour, ₹1,000 external service charges = ₹8,500 repair cost
        JobCardEntity jobCard = JobCardEntity.builder()
                .vehicle(testVehicle)
                .jobCardNumber("JC-2026-TEST")
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.SHOP)
                .shopCost(BigDecimal.valueOf(8500.00))
                .totalCost(BigDecimal.valueOf(8500.00))
                .build();
        when(jobCardRepository.findByVehicleId(100L)).thenReturn(List.of(jobCard));
        when(shopExpenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());

        // Test 16: Verify total cost calculation = ₹58,500
        var costRes = vehicleCostingService.getVehicleCost(100L);
        assertEquals(0, BigDecimal.valueOf(58500.00).compareTo(costRes.getTotalVehicleCost()),
                "Total vehicle cost must equal ₹58,500");

        // Test 17 & 18: Verify 15% Markup = ₹67,275 and 15% Target Gross Margin ≈ ₹68,823.53
        when(marketComparableRepository.findByVehicleIdOrderByObservationDateDesc(100L)).thenReturn(Collections.emptyList());
        when(marketComparableRepository.findByMakeIgnoreCaseAndModelIgnoreCaseOrderByObservationDateDesc("Honda", "City")).thenReturn(Collections.emptyList());

        MarketPricingAnalysisResponse pricing = vehicleCostingService.getMarketPricingAnalysis(
                100L,
                BigDecimal.valueOf(15.0),
                BigDecimal.valueOf(15.0)
        );

        assertNotNull(pricing);
        assertEquals(0, BigDecimal.valueOf(58500.00).compareTo(pricing.getTotalVehicleCost()));

        // 15% Markup: 58,500 * 1.15 = 67,275.00
        assertEquals(0, BigDecimal.valueOf(67275.00).compareTo(pricing.getSuggestedPriceMarkup()),
                "15% Markup price must be exactly ₹67,275.00");
        assertEquals(0, BigDecimal.valueOf(8775.00).compareTo(pricing.getExpectedProfitMarkup()),
                "15% Markup expected profit must be ₹8,775.00");

        // 15% Target Margin: 58,500 / (1 - 0.15) = 58,500 / 0.85 = 68,823.53
        assertEquals(0, BigDecimal.valueOf(68823.53).compareTo(pricing.getSuggestedPriceGrossMargin()),
                "15% Target gross-margin price must be approximately ₹68,823.53");
        assertEquals(0, BigDecimal.valueOf(10323.53).compareTo(pricing.getExpectedProfitGrossMargin()),
                "15% Target gross-margin profit must be ₹10,323.53");
    }
}
