package com.ims.unit.costing;

import com.ims.dtos.costing.VehicleCostResponse;
import com.ims.dtos.costing.VehicleProfitabilityResponse;
import com.ims.entity.broker.BrokerCommissionEntity;
import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.broker.BrokerVehicleListingEntity;
import com.ims.entity.costing.ShopExpenseEntity;
import com.ims.entity.costing.VehicleCostEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehiclePurchaseEntity;
import com.ims.entity.workshop.*;
import com.ims.enums.*;
import com.ims.repository.broker.BrokerCommissionRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.costing.VehicleCostRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.repository.vehicle.VehiclePurchaseRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.impl.costing.VehicleCostingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleCostingServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private VehicleCostRepository vehicleCostRepository;
    @Mock
    private VehiclePurchaseRepository purchaseRepository;
    @Mock
    private JobCardRepository jobCardRepository;
    @Mock
    private ShopExpenseRepository expenseRepository;
    @Mock
    private BrokerVehicleListingRepository listingRepository;
    @Mock
    private BrokerCommissionRepository commissionRepository;
    @Mock
    private SaleRepository saleRepository;
    @Mock
    private com.ims.repository.costing.MarketComparableRepository marketComparableRepository;

    @InjectMocks
    private VehicleCostingServiceImpl costingService;

    private VehicleEntity ownVehicle;
    private VehicleEntity brokerVehicle;

    @BeforeEach
    void setUp() {
        ownVehicle = VehicleEntity.builder()
                .registrationNumber("KA01AB1234")
                .vehicleType(VehicleType.CAR)
                .brand("Hyundai")
                .model("Creta")
                .ownershipType(OwnershipType.OWN)
                .status(VehicleStatus.AVAILABLE)
                .build();
        ownVehicle.setId(100L);

        brokerVehicle = VehicleEntity.builder()
                .registrationNumber("TN02CD5678")
                .vehicleType(VehicleType.CAR)
                .brand("Maruti")
                .model("Brezza")
                .ownershipType(OwnershipType.BROKER)
                .status(VehicleStatus.AVAILABLE)
                .build();
        brokerVehicle.setId(200L);
    }

    @Test
    @DisplayName("Scenario 1: Own Vehicle Cost = 5,80,000, Sale = 7,50,000 -> Gross Profit = 1,70,000")
    void testScenario1_OwnVehicleCostAndProfit() {
        // Arrange
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(ownVehicle));

        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(500000.00))
                .purchaseExpenses(BigDecimal.valueOf(10000.00))
                .purchaseDate(LocalDate.now())
                .sellerName("Ravi")
                .sellerPhone("9988776655")
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));

        // Job Card: Repairs = 50,000, Accessories = 20,000
        JobCardEntity jobCard = JobCardEntity.builder()
                .jobCardNumber("JC-001")
                .vehicle(ownVehicle)
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.SHOP)
                .shopCost(BigDecimal.valueOf(70000.00))
                .brokerCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.valueOf(70000.00))
                .parts(List.of(
                        JobCardPartEntity.builder().totalPrice(BigDecimal.valueOf(50000.00)).build(),
                        JobCardPartEntity.builder().totalPrice(BigDecimal.valueOf(20000.00)).build()
                ))
                .labourEntries(Collections.emptyList())
                .build();
        when(jobCardRepository.findByVehicleId(100L)).thenReturn(List.of(jobCard));
        when(expenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());
        when(vehicleCostRepository.save(any(VehicleCostEntity.class))).thenAnswer(i -> i.getArgument(0));

        // Act - Calculate Cost
        VehicleCostResponse costResponse = costingService.getVehicleCost(100L);

        // Assert Cost: 5,00,000 + 10,000 + 70,000 = 5,80,000
        assertEquals(0, costResponse.getPurchasePrice().compareTo(new BigDecimal("500000.00")));
        assertEquals(0, costResponse.getPurchaseExpenses().compareTo(new BigDecimal("10000.00")));
        assertEquals(0, costResponse.getShopRepairCost().compareTo(new BigDecimal("70000.00")));
        assertEquals(0, costResponse.getTotalVehicleCost().compareTo(new BigDecimal("580000.00")));

        // Act - Profitability calculation after sale of 7,50,000
        SaleEntity sale = SaleEntity.builder()
                .vehicle(ownVehicle)
                .finalSalePrice(BigDecimal.valueOf(750000.00))
                .saleType(SaleType.DIRECT)
                .status(SaleStatus.COMPLETED)
                .build();
        when(saleRepository.findByVehicleId(100L)).thenReturn(Optional.of(sale));
        VehicleCostEntity savedCost = VehicleCostEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(500000.00))
                .purchaseExpenses(BigDecimal.valueOf(10000.00))
                .shopRepairCost(BigDecimal.valueOf(70000.00))
                .totalVehicleCost(BigDecimal.valueOf(580000.00))
                .build();
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.of(savedCost));

        VehicleProfitabilityResponse profitResponse = costingService.getVehicleProfitability(100L);

        // Assert Profit: 7,50,000 - 5,80,000 = 1,70,000
        assertEquals(0, profitResponse.getSalePrice().compareTo(new BigDecimal("750000.00")));
        assertEquals(0, profitResponse.getTotalVehicleCost().compareTo(new BigDecimal("580000.00")));
        assertEquals(0, profitResponse.getOwnVehicleGrossProfit().compareTo(new BigDecimal("170000.00")));
        assertEquals(0, profitResponse.getRecognizedDealershipIncome().compareTo(new BigDecimal("170000.00")));
    }

    @Test
    @DisplayName("Scenario 2: Broker Vehicle Sold for 8,00,000 with Basis 7,75,000 -> Gross Commission = 25,000")
    void testScenario2_BrokerGrossCommission() {
        // Arrange
        when(vehicleRepository.findById(200L)).thenReturn(Optional.of(brokerVehicle));

        BrokerVehicleListingEntity listing = BrokerVehicleListingEntity.builder()
                .vehicle(brokerVehicle)
                .broker(BrokerEntity.builder().name("Raj").mobile("9876543210").build())
                .askingPrice(BigDecimal.valueOf(775000.00))
                .expectedSellingPrice(BigDecimal.valueOf(800000.00))
                .commissionType(CommissionType.FIXED)
                .commissionRate(BigDecimal.valueOf(25000.00))
                .listingDate(LocalDate.now())
                .listingStatus("ACTIVE")
                .build();
        when(listingRepository.findByVehicleId(200L)).thenReturn(Optional.of(listing));

        SaleEntity sale = SaleEntity.builder()
                .vehicle(brokerVehicle)
                .finalSalePrice(BigDecimal.valueOf(800000.00))
                .saleType(SaleType.DIRECT)
                .status(SaleStatus.COMPLETED)
                .build();
        when(saleRepository.findByVehicleId(200L)).thenReturn(Optional.of(sale));

        BrokerCommissionEntity commission = BrokerCommissionEntity.builder()
                .vehicle(brokerVehicle)
                .salePrice(BigDecimal.valueOf(800000.00))
                .brokerSettlementBasis(BigDecimal.valueOf(775000.00))
                .grossCommission(BigDecimal.valueOf(25000.00))
                .shopRepairDeduction(BigDecimal.ZERO)
                .otherShopExpenseDeduction(BigDecimal.ZERO)
                .netCommission(BigDecimal.valueOf(25000.00))
                .build();
        when(commissionRepository.findByVehicleId(200L)).thenReturn(Optional.of(commission));

        // Act
        VehicleProfitabilityResponse response = costingService.getVehicleProfitability(200L);

        // Assert
        assertEquals(0, response.getSalePrice().compareTo(new BigDecimal("800000.00")));
        assertEquals(0, response.getBrokerSettlementBasis().compareTo(new BigDecimal("775000.00")));
        assertEquals(0, response.getBrokerNetCommission().compareTo(new BigDecimal("25000.00")));
        assertEquals(0, response.getRecognizedDealershipIncome().compareTo(new BigDecimal("25000.00")));
        assertEquals(OwnershipType.BROKER, response.getOwnershipType());
    }

    @Test
    @DisplayName("Scenario 3: 20,000 Broker Repair split into 15,000 Broker & 5,000 Shop Responsibility")
    void testScenario3_BrokerRepairCostSplit() {
        // Arrange
        when(vehicleRepository.findById(200L)).thenReturn(Optional.of(brokerVehicle));

        JobCardEntity jobCard = JobCardEntity.builder()
                .jobCardNumber("JC-BRK-001")
                .vehicle(brokerVehicle)
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.SHARED)
                .brokerCost(BigDecimal.valueOf(15000.00))
                .shopCost(BigDecimal.valueOf(5000.00))
                .totalCost(BigDecimal.valueOf(20000.00))
                .build();
        when(jobCardRepository.findByVehicleId(200L)).thenReturn(List.of(jobCard));
        when(expenseRepository.findByVehicleId(200L)).thenReturn(Collections.emptyList());

        // Act
        VehicleCostResponse costResponse = costingService.getVehicleCost(200L);

        // Assert: Shop cost is exactly 5,000; broker portion 15,000 is NOT shop expense
        assertEquals(0, costResponse.getShopRepairCostBrokerShopBorne().compareTo(new BigDecimal("5000.00")));
        assertNull(costResponse.getPurchasePrice()); // Broker vehicle has null/no purchase cost
    }

    @Test
    @DisplayName("Authoritative Costing Engine: Base cost 5,22,000 + Job Card 8 (10,800) + Job Card 9 (5,400) = 5,38,200 when both completed")
    void testAuthoritativeCosting_MultipleFinalizedJobCards() {
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(ownVehicle));

        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(522000.00))
                .purchaseExpenses(BigDecimal.ZERO)
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));

        // Job Card #8: 10,800 COMPLETED
        JobCardEntity jc8 = JobCardEntity.builder()
                .jobCardNumber("JC-008")
                .vehicle(ownVehicle)
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.SHOP)
                .shopCost(BigDecimal.valueOf(10800.00))
                .totalCost(BigDecimal.valueOf(10800.00))
                .build();

        // Job Card #9: 5,400 COMPLETED
        JobCardEntity jc9 = JobCardEntity.builder()
                .jobCardNumber("JC-009")
                .vehicle(ownVehicle)
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.SHOP)
                .shopCost(BigDecimal.valueOf(5400.00))
                .totalCost(BigDecimal.valueOf(5400.00))
                .build();

        when(jobCardRepository.findByVehicleId(100L)).thenReturn(List.of(jc8, jc9));
        when(expenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());
        when(vehicleCostRepository.save(any(VehicleCostEntity.class))).thenAnswer(i -> i.getArgument(0));

        VehicleCostResponse costResponse = costingService.getVehicleCost(100L);

        // Assert: 5,22,000 + 10,800 + 5,400 = 5,38,200
        assertEquals(0, costResponse.getLandedAcquisitionCost().compareTo(new BigDecimal("522000.00")));
        assertEquals(0, costResponse.getShopRepairCost().compareTo(new BigDecimal("16200.00")));
        assertEquals(0, costResponse.getFinalizedDealerCost().compareTo(new BigDecimal("538200.00")));
        assertEquals(0, costResponse.getEstimatedRepairExposure().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("Open Job Card contributes to Estimated Exposure, NOT Finalized Capitalized Cost")
    void testOpenJobCard_IsolatedFromFinalizedCost() {
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(ownVehicle));

        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(522000.00))
                .purchaseExpenses(BigDecimal.ZERO)
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));

        // Job Card #9: 5,400 OPEN (Estimate)
        JobCardEntity jcOpen = JobCardEntity.builder()
                .jobCardNumber("JC-009-OPEN")
                .vehicle(ownVehicle)
                .status(JobCardStatus.OPEN)
                .costResponsibility(CostResponsibility.SHOP)
                .shopCost(BigDecimal.valueOf(5400.00))
                .totalCost(BigDecimal.valueOf(5400.00))
                .build();

        when(jobCardRepository.findByVehicleId(100L)).thenReturn(List.of(jcOpen));
        when(expenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());
        when(vehicleCostRepository.save(any(VehicleCostEntity.class))).thenAnswer(i -> i.getArgument(0));

        VehicleCostResponse costResponse = costingService.getVehicleCost(100L);

        // Finalized vehicle cost remains exactly 5,22,000; repair exposure is 5,400
        assertEquals(0, costResponse.getFinalizedDealerCost().compareTo(new BigDecimal("522000.00")));
        assertEquals(0, costResponse.getShopRepairCost().compareTo(BigDecimal.ZERO));
        assertEquals(0, costResponse.getEstimatedRepairExposure().compareTo(new BigDecimal("5400.00")));
    }

    @Test
    @DisplayName("Customer-Borne repair cost is excluded from Dealer Inventory Cost")
    void testCustomerBorneRepair_ExcludedFromDealerCost() {
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(ownVehicle));

        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(500000.00))
                .purchaseExpenses(BigDecimal.ZERO)
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));

        // Customer-borne job card
        JobCardEntity jcCustomer = JobCardEntity.builder()
                .jobCardNumber("JC-CUST-001")
                .vehicle(ownVehicle)
                .status(JobCardStatus.COMPLETED)
                .costResponsibility(CostResponsibility.CUSTOMER)
                .shopCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.valueOf(15000.00))
                .build();

        when(jobCardRepository.findByVehicleId(100L)).thenReturn(List.of(jcCustomer));
        when(expenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());
        when(vehicleCostRepository.save(any(VehicleCostEntity.class))).thenAnswer(i -> i.getArgument(0));

        VehicleCostResponse costResponse = costingService.getVehicleCost(100L);

        // Dealer cost remains 5,00,000; customer-borne amount recorded as 15,000
        assertEquals(0, costResponse.getFinalizedDealerCost().compareTo(new BigDecimal("500000.00")));
        assertEquals(0, costResponse.getCustomerBorneRepairAmount().compareTo(new BigDecimal("15000.00")));
    }

    @Test
    @DisplayName("Margin and Markup calculations produce different, correct values; Invalid margin rejected")
    void testMarginAndMarkupCalculations() {
        when(vehicleRepository.findById(100L)).thenReturn(Optional.of(ownVehicle));

        VehiclePurchaseEntity purchase = VehiclePurchaseEntity.builder()
                .vehicle(ownVehicle)
                .purchasePrice(BigDecimal.valueOf(500000.00))
                .purchaseExpenses(BigDecimal.ZERO)
                .build();
        when(purchaseRepository.findByVehicleId(100L)).thenReturn(Optional.of(purchase));
        when(jobCardRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(expenseRepository.findByVehicleId(100L)).thenReturn(Collections.emptyList());
        when(vehicleCostRepository.findByVehicleId(100L)).thenReturn(Optional.empty());
        when(vehicleCostRepository.save(any(VehicleCostEntity.class))).thenAnswer(i -> i.getArgument(0));

        // Markup 15%: 5,00,000 * 1.15 = 5,75,000
        // Gross Margin 15%: 5,00,000 / (1 - 0.15) = 5,00,000 / 0.85 = 5,88,235.29
        com.ims.dtos.costing.MarketPricingAnalysisResponse analysis = costingService.getMarketPricingAnalysis(
                100L,
                BigDecimal.valueOf(15.0),
                BigDecimal.valueOf(15.0)
        );

        assertEquals(0, analysis.getSuggestedPriceMarkup().compareTo(new BigDecimal("575000.00")));
        assertEquals(0, analysis.getSuggestedPriceGrossMargin().compareTo(new BigDecimal("588235.29")));
        assertNotEquals(analysis.getSuggestedPriceMarkup(), analysis.getSuggestedPriceGrossMargin());

        // Invalid target margin (>= 100%) throws BusinessRuleViolationException
        assertThrows(com.ims.exception.BusinessRuleViolationException.class, () ->
                costingService.getMarketPricingAnalysis(100L, BigDecimal.valueOf(10.0), BigDecimal.valueOf(100.0))
        );
    }
}
