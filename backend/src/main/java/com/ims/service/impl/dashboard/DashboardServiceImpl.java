package com.ims.service.impl.dashboard;

import com.ims.dtos.dashboard.DashboardSummaryResponse;
import com.ims.entity.broker.BrokerCommissionEntity;
import com.ims.entity.broker.BrokerSettlementEntity;
import com.ims.entity.costing.ShopExpenseEntity;
import com.ims.entity.costing.VehicleCostEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehiclePurchaseEntity;
import com.ims.enums.*;
import com.ims.repository.broker.BrokerCommissionRepository;
import com.ims.repository.broker.BrokerSettlementRepository;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.costing.VehicleCostRepository;
import com.ims.repository.finance.FinanceDetailRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.repository.service.ServiceRecordRepository;
import com.ims.repository.vehicle.VehiclePurchaseRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.serviceInterface.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePurchaseRepository vehiclePurchaseRepository;
    private final SaleRepository saleRepository;
    private final BrokerSettlementRepository brokerSettlementRepository;
    private final BrokerCommissionRepository brokerCommissionRepository;
    private final FinanceDetailRepository financeDetailRepository;
    private final JobCardRepository jobCardRepository;
    private final ShopExpenseRepository shopExpenseRepository;
    private final VehicleCostRepository vehicleCostRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());

        // 1. Inventory KPIs
        long totalOwn = vehicleRepository.countByOwnershipType(OwnershipType.OWN);
        long totalBroker = vehicleRepository.countByOwnershipType(OwnershipType.BROKER);
        long availableCars = vehicleRepository.countByVehicleTypeAndStatus(VehicleType.CAR, VehicleStatus.AVAILABLE);
        long availableBikes = vehicleRepository.countByVehicleTypeAndStatus(VehicleType.BIKE, VehicleStatus.AVAILABLE);
        long bookedVehicles = vehicleRepository.countByStatus(VehicleStatus.BOOKED);
        long soldVehicles = vehicleRepository.countByStatus(VehicleStatus.SOLD);
        long deliveredVehicles = vehicleRepository.countByStatus(VehicleStatus.DELIVERED);

        DashboardSummaryResponse.InventoryKpi inventory = DashboardSummaryResponse.InventoryKpi.builder()
                .totalOwnVehicles(totalOwn)
                .totalBrokerVehicles(totalBroker)
                .availableCars(availableCars)
                .availableBikes(availableBikes)
                .bookedVehicles(bookedVehicles)
                .soldVehicles(soldVehicles)
                .deliveredVehicles(deliveredVehicles)
                .build();

        // 2. Purchase KPIs
        List<VehiclePurchaseEntity> todayPurchases = vehiclePurchaseRepository.findByPurchaseDate(today);
        List<VehiclePurchaseEntity> monthPurchases = vehiclePurchaseRepository.findByPurchaseDateBetween(firstDayOfMonth, today);
        List<VehiclePurchaseEntity> allPurchases = vehiclePurchaseRepository.findAll();

        BigDecimal todayPurchaseAmount = todayPurchases.stream()
                .map(VehiclePurchaseEntity::getPurchasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthPurchaseAmount = monthPurchases.stream()
                .map(VehiclePurchaseEntity::getPurchasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPurchaseAmount = allPurchases.stream()
                .map(VehiclePurchaseEntity::getPurchasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardSummaryResponse.PurchaseKpi purchases = DashboardSummaryResponse.PurchaseKpi.builder()
                .todayPurchasesCount(todayPurchases.size())
                .todayPurchasesAmount(todayPurchaseAmount)
                .monthlyPurchasesCount(monthPurchases.size())
                .monthlyPurchasesAmount(monthPurchaseAmount)
                .totalPurchasesAmount(totalPurchaseAmount)
                .build();

        // 3. Sales KPIs
        List<SaleEntity> todaySales = saleRepository.findBySaleDate(today);
        List<SaleEntity> monthSales = saleRepository.findBySaleDateBetween(firstDayOfMonth, today);
        List<SaleEntity> allSales = saleRepository.findAll();

        BigDecimal todaySalesAmount = todaySales.stream()
                .map(SaleEntity::getFinalSalePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthSalesAmount = monthSales.stream()
                .map(SaleEntity::getFinalSalePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long directSalesCount = allSales.stream().filter(s -> s.getSaleType() == SaleType.DIRECT).count();
        long financeSalesCount = allSales.stream().filter(s -> s.getSaleType() == SaleType.FINANCE).count();
        long carSalesCount = allSales.stream().filter(s -> s.getVehicle().getVehicleType() == VehicleType.CAR).count();
        long bikeSalesCount = allSales.stream().filter(s -> s.getVehicle().getVehicleType() == VehicleType.BIKE).count();

        DashboardSummaryResponse.SalesKpi sales = DashboardSummaryResponse.SalesKpi.builder()
                .todaySalesCount(todaySales.size())
                .todaySalesAmount(todaySalesAmount)
                .monthlySalesCount(monthSales.size())
                .monthlySalesAmount(monthSalesAmount)
                .directSalesCount(directSalesCount)
                .financeSalesCount(financeSalesCount)
                .carSalesCount(carSalesCount)
                .bikeSalesCount(bikeSalesCount)
                .build();

        // 4. Financial KPIs
        List<VehicleCostEntity> allCosts = vehicleCostRepository.findAll();
        BigDecimal totalOwnVehicleCost = allCosts.stream()
                .map(VehicleCostEntity::getTotalVehicleCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate recognized gross profit for sold own vehicles
        BigDecimal totalOwnProfit = allSales.stream()
                .filter(s -> s.getVehicle().getOwnershipType() == OwnershipType.OWN)
                .map(s -> {
                    BigDecimal vCost = vehicleCostRepository.findByVehicleId(s.getVehicle().getId())
                            .map(VehicleCostEntity::getTotalVehicleCost)
                            .orElse(BigDecimal.ZERO);
                    return s.getFinalSalePrice().subtract(vCost);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BrokerCommissionEntity> allCommissions = brokerCommissionRepository.findAll();
        BigDecimal totalGrossCommission = allCommissions.stream()
                .map(BrokerCommissionEntity::getGrossCommission)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalNetCommission = allCommissions.stream()
                .map(BrokerCommissionEntity::getNetCommission)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<BrokerSettlementEntity> allSettlements = brokerSettlementRepository.findAll();
        BigDecimal pendingSettlementAmount = allSettlements.stream()
                .filter(s -> s.getSettlementStatus() != SettlementStatus.PAID)
                .map(BrokerSettlementEntity::getBalanceAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingFinanceCount = financeDetailRepository.countByStatus(FinanceStatus.PENDING);

        List<ShopExpenseEntity> allExpenses = shopExpenseRepository.findAll();
        BigDecimal totalExpenses = allExpenses.stream()
                .map(ShopExpenseEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = allSales.stream()
                .map(SaleEntity::getBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardSummaryResponse.FinancialKpi financial = DashboardSummaryResponse.FinancialKpi.builder()
                .totalOwnVehicleCost(totalOwnVehicleCost)
                .totalOwnVehicleProfit(totalOwnProfit)
                .totalBrokerGrossCommission(totalGrossCommission)
                .totalBrokerNetCommission(totalNetCommission)
                .pendingBrokerSettlementAmount(pendingSettlementAmount)
                .pendingFinanceCount(pendingFinanceCount)
                .totalExpenses(totalExpenses)
                .totalOutstandingBalances(totalOutstanding)
                .build();

        long pendingJobCards = jobCardRepository.countByStatus(JobCardStatus.OPEN)
                + jobCardRepository.countByStatus(JobCardStatus.IN_PROGRESS)
                + jobCardRepository.countByStatus(JobCardStatus.WAITING_FOR_PARTS);
        long vehiclesUnderRepair = vehicleRepository.countByStatus(VehicleStatus.REPAIR);
        long readyForSale = vehicleRepository.countByStatus(VehicleStatus.READY_FOR_SALE);

        DashboardSummaryResponse.WorkshopKpi workshop = DashboardSummaryResponse.WorkshopKpi.builder()
                .pendingJobCardsCount(pendingJobCards)
                .vehiclesUnderRepairCount(vehiclesUnderRepair)
                .readyForSaleCount(readyForSale)
                .partsUsedCount(0) // populated through workshop metrics
                .build();

        // 6. Service KPIs
        long todayService = serviceRecordRepository.countByServiceDate(today);
        long upcomingService = serviceRecordRepository.countUpcomingServices(today, today.plusDays(7));
        long dueService = serviceRecordRepository.countDueServices(today);
        long overdueService = serviceRecordRepository.countOverdueServices(today);

        DashboardSummaryResponse.ServiceKpi service = DashboardSummaryResponse.ServiceKpi.builder()
                .todayServiceCount(todayService)
                .upcomingServiceCount(upcomingService)
                .dueServiceCount(dueService)
                .overdueServiceCount(overdueService)
                .build();

        return DashboardSummaryResponse.builder()
                .inventory(inventory)
                .purchases(purchases)
                .sales(sales)
                .financial(financial)
                .workshop(workshop)
                .service(service)
                .build();
    }
}
