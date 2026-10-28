package com.ims.service.impl.reports;

import com.ims.dtos.reports.*;
import com.ims.entity.broker.BrokerCommissionEntity;
import com.ims.entity.broker.BrokerSettlementEntity;
import com.ims.entity.costing.VehicleCostEntity;
import com.ims.entity.inventory.PartEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.service.ServiceRecordEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.OwnershipType;
import com.ims.repository.broker.BrokerCommissionRepository;
import com.ims.repository.broker.BrokerSettlementRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.repository.costing.VehicleCostRepository;
import com.ims.repository.inventory.PartRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.repository.service.ServiceRecordRepository;
import com.ims.repository.vehicle.VehiclePurchaseRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.serviceInterface.reports.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePurchaseRepository purchaseRepository;
    private final BrokerVehicleListingRepository listingRepository;
    private final SaleRepository saleRepository;
    private final VehicleCostRepository vehicleCostRepository;
    private final BrokerCommissionRepository commissionRepository;
    private final BrokerSettlementRepository settlementRepository;
    private final PartRepository partRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VehicleReportRow> getVehicleReport(String ownershipType, String status) {
        List<VehicleEntity> vehicles = vehicleRepository.findAll();

        return vehicles.stream()
                .filter(v -> ownershipType == null || ownershipType.isBlank() || v.getOwnershipType().name().equalsIgnoreCase(ownershipType))
                .filter(v -> status == null || status.isBlank() || v.getStatus().name().equalsIgnoreCase(status))
                .map(v -> {
                    LocalDate date = null;
                    BigDecimal price = BigDecimal.ZERO;

                    if (v.getOwnershipType() == OwnershipType.OWN) {
                        var pOpt = purchaseRepository.findByVehicleId(v.getId());
                        if (pOpt.isPresent()) {
                            date = pOpt.get().getPurchaseDate();
                            price = pOpt.get().getPurchasePrice();
                        }
                    } else {
                        var lOpt = listingRepository.findByVehicleId(v.getId());
                        if (lOpt.isPresent()) {
                            date = lOpt.get().getListingDate();
                            price = lOpt.get().getAskingPrice();
                        }
                    }

                    return VehicleReportRow.builder()
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .vehicleType(v.getVehicleType().name())
                            .brand(v.getBrand())
                            .model(v.getModel())
                            .variant(v.getVariant())
                            .manufacturingYear(v.getManufacturingYear())
                            .fuelType(v.getFuelType().name())
                            .ownershipType(v.getOwnershipType().name())
                            .status(v.getStatus().name())
                            .odometerReading(v.getOdometerReading())
                            .purchaseOrListingDate(date)
                            .purchasePriceOrAskingPrice(price)
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesReportRow> getSalesReport(LocalDate fromDate, LocalDate toDate, String saleType) {
        List<SaleEntity> sales = (fromDate != null && toDate != null)
                ? saleRepository.findBySaleDateBetween(fromDate, toDate)
                : saleRepository.findAll();

        return sales.stream()
                .filter(s -> saleType == null || saleType.isBlank() || s.getSaleType().name().equalsIgnoreCase(saleType))
                .map(s -> SalesReportRow.builder()
                        .saleId(s.getId())
                        .saleNumber(s.getSaleNumber())
                        .saleDate(s.getSaleDate())
                        .customerName(s.getCustomer().getName())
                        .vehicleRegistrationNumber(s.getVehicle().getRegistrationNumber())
                        .vehicleType(s.getVehicle().getVehicleType().name())
                        .ownershipType(s.getVehicle().getOwnershipType().name())
                        .saleType(s.getSaleType().name())
                        .agreedPrice(s.getAgreedPrice())
                        .discountAmount(s.getDiscountAmount())
                        .finalSalePrice(s.getFinalSalePrice())
                        .totalPaid(s.getTotalPaid())
                        .balanceDue(s.getBalanceDue())
                        .status(s.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfitReportRow> getProfitReport(LocalDate fromDate, LocalDate toDate) {
        List<SaleEntity> sales = (fromDate != null && toDate != null)
                ? saleRepository.findBySaleDateBetween(fromDate, toDate)
                : saleRepository.findAll();

        List<ProfitReportRow> rows = new ArrayList<>();
        for (SaleEntity s : sales) {
            VehicleEntity v = s.getVehicle();
            if (v.getOwnershipType() == OwnershipType.OWN) {
                BigDecimal totalCost = vehicleCostRepository.findByVehicleId(v.getId())
                        .map(VehicleCostEntity::getTotalVehicleCost)
                        .orElse(BigDecimal.ZERO);
                BigDecimal profit = s.getFinalSalePrice().subtract(totalCost);

                rows.add(ProfitReportRow.builder()
                        .vehicleId(v.getId())
                        .registrationNumber(v.getRegistrationNumber())
                        .vehicleBrand(v.getBrand())
                        .vehicleModel(v.getModel())
                        .ownershipType("OWN")
                        .saleDate(s.getSaleDate())
                        .sellingPrice(s.getFinalSalePrice())
                        .totalCostOrSettlementBasis(totalCost)
                        .shopRepairsAndExpenses(BigDecimal.ZERO)
                        .recognizedGrossProfitOrNetCommission(profit)
                        .build());
            } else {
                var commOpt = commissionRepository.findBySaleId(s.getId());
                if (commOpt.isPresent()) {
                    BrokerCommissionEntity c = commOpt.get();
                    BigDecimal totalShopDeductions = c.getShopRepairDeduction().add(c.getOtherShopExpenseDeduction());

                    rows.add(ProfitReportRow.builder()
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .vehicleBrand(v.getBrand())
                            .vehicleModel(v.getModel())
                            .ownershipType("BROKER")
                            .saleDate(s.getSaleDate())
                            .sellingPrice(s.getFinalSalePrice())
                            .totalCostOrSettlementBasis(c.getBrokerSettlementBasis())
                            .shopRepairsAndExpenses(totalShopDeductions)
                            .recognizedGrossProfitOrNetCommission(c.getNetCommission())
                            .build());
                }
            }
        }
        return rows;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrokerReportRow> getBrokerReport(Long brokerId, LocalDate fromDate, LocalDate toDate) {
        List<BrokerSettlementEntity> settlements = settlementRepository.findAll();

        return settlements.stream()
                .filter(s -> brokerId == null || s.getBroker().getId().equals(brokerId))
                .map(s -> {
                    Optional<SaleEntity> saleOpt = saleRepository.findById(s.getSaleId());
                    LocalDate saleDate = saleOpt.map(SaleEntity::getSaleDate).orElse(null);

                    if (fromDate != null && saleDate != null && saleDate.isBefore(fromDate)) return null;
                    if (toDate != null && saleDate != null && saleDate.isAfter(toDate)) return null;

                    var commOpt = commissionRepository.findBySaleId(s.getSaleId());
                    BigDecimal basis = commOpt.map(BrokerCommissionEntity::getBrokerSettlementBasis).orElse(s.getBrokerAmount());
                    BigDecimal shopRepairs = commOpt.map(BrokerCommissionEntity::getShopRepairDeduction).orElse(BigDecimal.ZERO);
                    BigDecimal netComm = commOpt.map(BrokerCommissionEntity::getNetCommission).orElse(s.getGrossCommission());

                    return BrokerReportRow.builder()
                            .brokerId(s.getBroker().getId())
                            .brokerName(s.getBroker().getName())
                            .brokerMobile(s.getBroker().getMobile())
                            .vehicleId(s.getVehicle().getId())
                            .vehicleRegistrationNumber(s.getVehicle().getRegistrationNumber())
                            .saleDate(saleDate)
                            .saleAmount(s.getSaleAmount())
                            .brokerSettlementBasis(basis)
                            .grossCommission(s.getGrossCommission())
                            .shopRepairDeduction(shopRepairs)
                            .netCommission(netComm)
                            .netPayableToBroker(s.getNetPayable())
                            .paidToBroker(s.getPaidAmount())
                            .balanceToBroker(s.getBalanceAmount())
                            .settlementStatus(s.getSettlementStatus().name())
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockReportRow> getStockReport(Boolean lowStockOnly) {
        List<PartEntity> parts = partRepository.findAll();

        return parts.stream()
                .filter(p -> {
                    if (Boolean.TRUE.equals(lowStockOnly)) {
                        return p.getCurrentStock() <= p.getLowStockThreshold();
                    }
                    return true;
                })
                .map(p -> {
                    BigDecimal stockVal = p.getPurchasePrice().multiply(BigDecimal.valueOf(p.getCurrentStock()));
                    boolean isLow = p.getCurrentStock() <= p.getLowStockThreshold();

                    return StockReportRow.builder()
                            .partId(p.getId())
                            .partNumber(p.getSku())
                            .name(p.getName())
                            .category(p.getCategory().name())
                            .unit(p.getUnit())
                            .currentStock(p.getCurrentStock())
                            .minStockThreshold(p.getLowStockThreshold())
                            .purchasePrice(p.getPurchasePrice())
                            .sellingPrice(p.getSellingPrice())
                            .inventoryValue(stockVal)
                            .isLowStock(isLow)
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceReportRow> getServiceReport(LocalDate fromDate, LocalDate toDate) {
        List<ServiceRecordEntity> records = serviceRecordRepository.findAll();

        return records.stream()
                .filter(r -> {
                    if (fromDate != null && r.getServiceDate().isBefore(fromDate)) return false;
                    if (toDate != null && r.getServiceDate().isAfter(toDate)) return false;
                    return true;
                })
                .map(r -> ServiceReportRow.builder()
                        .serviceId(r.getId())
                        .serviceNumber(r.getServiceNumber())
                        .serviceDate(r.getServiceDate())
                        .customerName(r.getCustomer().getName())
                        .customerMobile(r.getCustomer().getMobile())
                        .vehicleRegistrationNumber(r.getVehicle().getRegistrationNumber())
                        .currentKm(r.getCurrentKm())
                        .labourAmount(r.getLabourAmount())
                        .partsAmount(r.getPartsAmount())
                        .totalAmount(r.getTotalAmount())
                        .nextServiceDate(r.getNextServiceDate())
                        .nextServiceKm(r.getNextServiceKm())
                        .status(r.getStatus().name())
                        .assignedStaff(r.getAssignedStaff())
                        .build())
                .collect(Collectors.toList());
    }
}
