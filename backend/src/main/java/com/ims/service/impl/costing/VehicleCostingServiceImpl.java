package com.ims.service.impl.costing;

import com.ims.common.PageResponse;
import com.ims.dtos.costing.*;
import com.ims.entity.broker.BrokerCommissionEntity;
import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.broker.BrokerVehicleListingEntity;
import com.ims.entity.costing.MarketComparableEntity;
import com.ims.entity.costing.ShopExpenseEntity;
import com.ims.entity.costing.VehicleCostEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.entity.vehicle.VehiclePurchaseEntity;
import com.ims.entity.workshop.JobCardEntity;
import com.ims.enums.OwnershipType;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.repository.broker.BrokerCommissionRepository;
import com.ims.repository.broker.BrokerRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.repository.costing.MarketComparableRepository;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.costing.VehicleCostRepository;
import com.ims.repository.sales.SaleRepository;
import com.ims.repository.vehicle.VehiclePurchaseRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.serviceInterface.costing.VehicleCostingService;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleCostingServiceImpl implements VehicleCostingService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePurchaseRepository purchaseRepository;
    private final VehicleCostRepository vehicleCostRepository;
    private final JobCardRepository jobCardRepository;
    private final ShopExpenseRepository shopExpenseRepository;
    private final BrokerVehicleListingRepository brokerListingRepository;
    private final BrokerCommissionRepository brokerCommissionRepository;
    private final BrokerRepository brokerRepository;
    private final SaleRepository saleRepository;
    private final MarketComparableRepository marketComparableRepository;

    @Override
    @Transactional
    public VehicleCostResponse getVehicleCost(Long vehicleId) {
        log.info("Calculating vehicle costing breakdown for vehicle ID: {}", vehicleId);
        try {
            VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

            List<JobCardEntity> jobCards = jobCardRepository.findByVehicleId(vehicleId);
            if (jobCards == null) {
                jobCards = Collections.emptyList();
            }

            // Classify job cards and calculate breakdown
            BigDecimal finalizedShopRepairCost = BigDecimal.ZERO;
            BigDecimal finalizedAccessoriesCost = BigDecimal.ZERO;
            BigDecimal finalizedLabourCost = BigDecimal.ZERO;
            BigDecimal estimatedRepairExposure = BigDecimal.ZERO;
            BigDecimal customerBorneRepairAmount = BigDecimal.ZERO;
            BigDecimal brokerBorneRepairAmount = BigDecimal.ZERO;

            List<VehicleCostResponse.JobCardCostItemDto> breakdownList = new ArrayList<>();

            for (JobCardEntity jc : jobCards) {
                boolean isFinalized = jc.getStatus() != null &&
                        (jc.getStatus() == com.ims.enums.JobCardStatus.COMPLETED || jc.getStatus() == com.ims.enums.JobCardStatus.CLOSED);
                BigDecimal jcTotal = jc.getTotalCost() != null ? jc.getTotalCost() : BigDecimal.ZERO;
                BigDecimal jcShop = jc.getShopCost() != null ? jc.getShopCost() : BigDecimal.ZERO;
                BigDecimal jcBroker = jc.getBrokerCost() != null ? jc.getBrokerCost() : BigDecimal.ZERO;
                BigDecimal jcCustomer = (jc.getCostResponsibility() == com.ims.enums.CostResponsibility.CUSTOMER) ? jcTotal : BigDecimal.ZERO;

                if (jc.getCostResponsibility() == com.ims.enums.CostResponsibility.CUSTOMER) {
                    customerBorneRepairAmount = customerBorneRepairAmount.add(jcTotal);
                } else if (jc.getCostResponsibility() == com.ims.enums.CostResponsibility.BROKER) {
                    brokerBorneRepairAmount = brokerBorneRepairAmount.add(jcBroker);
                } else if (jc.getCostResponsibility() == com.ims.enums.CostResponsibility.SHARED) {
                    brokerBorneRepairAmount = brokerBorneRepairAmount.add(jcBroker);
                }

                if (isFinalized) {
                    // Finalized dealer-borne cost capitalization
                    finalizedShopRepairCost = finalizedShopRepairCost.add(jcShop);
                    if (jc.getParts() != null) {
                        finalizedAccessoriesCost = finalizedAccessoriesCost.add(
                                jc.getParts().stream()
                                        .map(p -> p.getTotalPrice() != null ? p.getTotalPrice() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        );
                    }
                    if (jc.getLabourEntries() != null) {
                        finalizedLabourCost = finalizedLabourCost.add(
                                jc.getLabourEntries().stream()
                                        .map(l -> l.getTotalAmount() != null ? l.getTotalAmount() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        );
                    }
                } else if (jc.getStatus() != null && jc.getStatus() != com.ims.enums.JobCardStatus.CANCELLED) {
                    // Open / In-progress job cards contribute to estimated exposure, not capitalized cost
                    estimatedRepairExposure = estimatedRepairExposure.add(jcShop);
                }

                breakdownList.add(VehicleCostResponse.JobCardCostItemDto.builder()
                        .jobCardId(jc.getId())
                        .jobCardNumber(jc.getJobCardNumber())
                        .status(jc.getStatus() != null ? jc.getStatus().name() : null)
                        .costResponsibility(jc.getCostResponsibility() != null ? jc.getCostResponsibility().name() : "SHOP")
                        .totalCost(jcTotal)
                        .shopCost(jcShop)
                        .brokerCost(jcBroker)
                        .customerCost(jcCustomer)
                        .finalized(isFinalized)
                        .remarks(jc.getRemarks())
                        .build());
            }

            // Aggregate vehicle-specific shop expenses
            List<ShopExpenseEntity> expenses = shopExpenseRepository.findByVehicleId(vehicleId);
            BigDecimal otherExpenses = (expenses != null)
                    ? expenses.stream()
                    .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    : BigDecimal.ZERO;

            // Sale price if already sold
            SaleEntity existingSale = saleRepository.findByVehicleId(vehicleId).orElse(null);
            BigDecimal approvedNegotiatedPrice = existingSale != null ? existingSale.getFinalSalePrice() : null;

        if (vehicle.getOwnershipType() == OwnershipType.OWN) {
            VehiclePurchaseEntity purchase = purchaseRepository.findByVehicleId(vehicleId).orElse(null);
            BigDecimal purchasePrice = purchase != null && purchase.getPurchasePrice() != null ? purchase.getPurchasePrice() : BigDecimal.ZERO;
            BigDecimal purchaseExpenses = purchase != null && purchase.getPurchaseExpenses() != null ? purchase.getPurchaseExpenses() : BigDecimal.ZERO;
            BigDecimal purchaseCredits = BigDecimal.ZERO; // Reserved for purchase supplier credit returns

            // Landed Acquisition Cost: Purchase consideration + eligible acquisition expenses - credits
            BigDecimal landedAcquisitionCost = purchasePrice.add(purchaseExpenses).subtract(purchaseCredits);

            // Final Vehicle Cost: Landed Cost + Finalized Dealer-Borne Capitalized Refurbishment + Approved Expenses - Credits
            BigDecimal finalVehicleCost = landedAcquisitionCost.add(finalizedShopRepairCost).add(otherExpenses);

            // Calculate Authoritative Selling Price Recommendations (Default 15% margin and 15% markup)
            BigDecimal defaultMarkup = BigDecimal.valueOf(15.0);
            BigDecimal defaultMargin = BigDecimal.valueOf(15.0);

            BigDecimal markupFactor = BigDecimal.ONE.add(defaultMarkup.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal recommendedMarkupPrice = finalVehicleCost.multiply(markupFactor).setScale(2, RoundingMode.HALF_UP);

            BigDecimal marginDivisor = BigDecimal.ONE.subtract(defaultMargin.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal recommendedMarginPrice = marginDivisor.compareTo(BigDecimal.ZERO) > 0
                    ? finalVehicleCost.divide(marginDivisor, 2, RoundingMode.HALF_UP)
                    : finalVehicleCost;

            VehicleCostEntity costEntity = vehicleCostRepository.findByVehicleId(vehicleId)
                    .orElseGet(() -> VehicleCostEntity.builder().vehicle(vehicle).build());

            costEntity.setPurchasePrice(purchasePrice);
            costEntity.setPurchaseExpenses(purchaseExpenses);
            costEntity.setShopRepairCost(finalizedShopRepairCost);
            costEntity.setAccessoriesCost(finalizedAccessoriesCost);
            costEntity.setLabourCost(finalizedLabourCost);
            costEntity.setOtherExpenses(otherExpenses);
            costEntity.setTotalVehicleCost(finalVehicleCost);
            costEntity.setUpdatedAt(Instant.now());
            vehicleCostRepository.save(costEntity);

            return VehicleCostResponse.builder()
                    .vehicleId(vehicle.getId())
                    .registrationNumber(vehicle.getRegistrationNumber())
                    .ownershipType(OwnershipType.OWN)
                    .purchasePrice(purchasePrice)
                    .purchaseExpenses(purchaseExpenses)
                    .purchaseCredits(purchaseCredits)
                    .landedAcquisitionCost(landedAcquisitionCost)
                    .shopRepairCost(finalizedShopRepairCost)
                    .accessoriesCost(finalizedAccessoriesCost)
                    .labourCost(finalizedLabourCost)
                    .otherExpenses(otherExpenses)
                    .finalizedDealerCost(finalVehicleCost)
                    .estimatedRepairExposure(estimatedRepairExposure)
                    .customerBorneRepairAmount(customerBorneRepairAmount)
                    .brokerBorneRepairAmount(brokerBorneRepairAmount)
                    .totalVehicleCost(finalVehicleCost)
                    .targetMarkupPercentage(defaultMarkup)
                    .recommendedSellingPriceMarkup(recommendedMarkupPrice)
                    .targetGrossMarginPercentage(defaultMargin)
                    .recommendedSellingPriceGrossMargin(recommendedMarginPrice)
                    .approvedNegotiatedPrice(approvedNegotiatedPrice)
                    .jobCardBreakdown(breakdownList)
                    .calculatedAt(Instant.now())
                    .build();
        } else {
            // BROKER vehicle
            BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);
            BigDecimal askingPrice = listing != null ? listing.getAskingPrice() : BigDecimal.ZERO;
            BigDecimal advertisedPrice = listing != null ? listing.getExpectedSellingPrice() : askingPrice;

            return VehicleCostResponse.builder()
                    .vehicleId(vehicle.getId())
                    .registrationNumber(vehicle.getRegistrationNumber())
                    .ownershipType(OwnershipType.BROKER)
                    .brokerAskingPrice(askingPrice)
                    .advertisedSellingPrice(advertisedPrice)
                    .shopRepairCost(finalizedShopRepairCost)
                    .shopRepairCostBrokerShopBorne(finalizedShopRepairCost)
                    .estimatedRepairExposure(estimatedRepairExposure)
                    .customerBorneRepairAmount(customerBorneRepairAmount)
                    .brokerBorneRepairAmount(brokerBorneRepairAmount)
                    .otherShopExpenses(otherExpenses)
                    .approvedNegotiatedPrice(approvedNegotiatedPrice)
                    .jobCardBreakdown(breakdownList)
                    .calculatedAt(Instant.now())
                    .build();
        }
    } catch (Exception ex) {
        log.error("Error calculating vehicle costing for vehicle ID: {} - {}", vehicleId, ex.getMessage(), ex);
        throw ex;
    }
}

    @Override
    @Transactional(readOnly = true)
    public VehicleProfitabilityResponse getVehicleProfitability(Long vehicleId) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        SaleEntity sale = saleRepository.findByVehicleId(vehicleId).orElse(null);
        BigDecimal salePrice = sale != null ? sale.getFinalSalePrice() : BigDecimal.ZERO;

        if (vehicle.getOwnershipType() == OwnershipType.OWN) {
            VehicleCostEntity costEntity = vehicleCostRepository.findByVehicleId(vehicleId)
                    .orElse(null);

            BigDecimal totalCost = costEntity != null ? costEntity.getTotalVehicleCost() : BigDecimal.ZERO;
            BigDecimal ownProfit = salePrice.subtract(totalCost);

            return VehicleProfitabilityResponse.builder()
                    .vehicleId(vehicle.getId())
                    .registrationNumber(vehicle.getRegistrationNumber())
                    .ownershipType(OwnershipType.OWN)
                    .salePrice(salePrice)
                    .totalVehicleCost(totalCost)
                    .ownVehicleGrossProfit(ownProfit)
                    .recognizedDealershipIncome(ownProfit)
                    .accountingNote("Dealership Own Inventory Sale: Revenue Recognized = Sale Price (₹" + salePrice +
                            ") - Total Vehicle Cost (₹" + totalCost + ") = Recognized Gross Profit (₹" + ownProfit + ")")
                    .build();
        } else {
            // BROKER vehicle profitability
            BrokerCommissionEntity comm = brokerCommissionRepository.findByVehicleId(vehicleId).orElse(null);
            BrokerVehicleListingEntity listing = brokerListingRepository.findByVehicleId(vehicleId).orElse(null);

            BigDecimal grossCommission = comm != null ? comm.getGrossCommission() : BigDecimal.ZERO;
            BigDecimal settlementBasis = comm != null ? comm.getBrokerSettlementBasis() :
                    (listing != null ? listing.getAskingPrice() : BigDecimal.ZERO);

            BigDecimal shopRepairs = comm != null ? comm.getShopRepairDeduction() : BigDecimal.ZERO;
            BigDecimal otherExpenses = comm != null ? comm.getOtherShopExpenseDeduction() : BigDecimal.ZERO;
            BigDecimal netCommission = comm != null ? comm.getNetCommission() : grossCommission.subtract(shopRepairs).subtract(otherExpenses);

            return VehicleProfitabilityResponse.builder()
                    .vehicleId(vehicle.getId())
                    .registrationNumber(vehicle.getRegistrationNumber())
                    .ownershipType(OwnershipType.BROKER)
                    .salePrice(salePrice)
                    .brokerSettlementBasis(settlementBasis)
                    .brokerGrossCommission(grossCommission)
                    .shopBorneExpenses(shopRepairs.add(otherExpenses))
                    .brokerNetCommission(netCommission)
                    .recognizedDealershipIncome(netCommission)
                    .accountingNote("Broker Consignment Sale: Full sale amount belongs to Broker obligation. Dealership recognizes ONLY Net Sales Commission (₹" +
                            netCommission + ") as Dealership Income.")
                    .build();
        }
    }

    @Override
    @Transactional
    public ShopExpenseResponse addShopExpense(ShopExpenseCreateRequest request) {
        VehicleEntity vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", request.getVehicleId()));
        }

        BrokerEntity broker = null;
        if (request.getBrokerId() != null) {
            broker = brokerRepository.findById(request.getBrokerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Broker", "id", request.getBrokerId()));
        }

        ShopExpenseEntity expense = ShopExpenseEntity.builder()
                .category(request.getCategory().trim().toUpperCase())
                .description(request.getDescription().trim())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .vehicle(vehicle)
                .broker(broker)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH")
                .referenceNo(request.getReferenceNo())
                .createdAt(Instant.now())
                .build();

        ShopExpenseEntity saved = shopExpenseRepository.save(expense);
        return toExpenseResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ShopExpenseResponse> getShopExpenses(Long vehicleId, Long brokerId, Pageable pageable) {
        Specification<ShopExpenseEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            if (brokerId != null) {
                predicates.add(cb.equal(root.get("broker").get("id"), brokerId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ShopExpenseEntity> page = shopExpenseRepository.findAll(spec, pageable);
        List<ShopExpenseResponse> dtos = page.getContent().stream()
                .map(this::toExpenseResponse)
                .collect(Collectors.toList());

        return PageResponse.of(page, dtos);
    }

    // ==========================================
    // MARKET RATE ANALYSIS & PRICING
    // ==========================================

    @Override
    @Transactional
    public MarketComparableResponse addMarketComparable(MarketComparableCreateRequest request, String username) {
        VehicleEntity vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        }

        MarketComparableEntity entity = MarketComparableEntity.builder()
                .vehicle(vehicle)
                .make(request.getMake().trim())
                .model(request.getModel().trim())
                .variant(request.getVariant())
                .manufacturingYear(request.getManufacturingYear())
                .registrationYear(request.getRegistrationYear())
                .fuelType(request.getFuelType())
                .transmission(request.getTransmission())
                .odometerReading(request.getOdometerReading())
                .vehicleCondition(request.getVehicleCondition() != null ? request.getVehicleCondition() : "GOOD")
                .location(request.getLocation())
                .askingPrice(request.getAskingPrice())
                .listingSource(request.getListingSource())
                .listingUrl(request.getListingUrl())
                .observationDate(request.getObservationDate() != null ? request.getObservationDate() : LocalDate.now())
                .notes(request.getNotes())
                .createdByUser(username)
                .build();

        MarketComparableEntity saved = marketComparableRepository.save(entity);
        return toComparableResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarketComparableResponse> getMarketComparables(Long vehicleId) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        List<MarketComparableEntity> list = marketComparableRepository.findByVehicleIdOrderByObservationDateDesc(vehicleId);
        if (list.isEmpty()) {
            list = marketComparableRepository.findByMakeIgnoreCaseAndModelIgnoreCaseOrderByObservationDateDesc(vehicle.getBrand(), vehicle.getModel());
        }

        return list.stream().map(this::toComparableResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MarketPricingAnalysisResponse getMarketPricingAnalysis(Long vehicleId, BigDecimal markupPercentage, BigDecimal targetGrossMarginPercentage) {
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        VehicleCostResponse costRes = getVehicleCost(vehicleId);
        BigDecimal totalCost = costRes.getTotalVehicleCost() != null ? costRes.getTotalVehicleCost() : BigDecimal.ZERO;

        BigDecimal markup = markupPercentage != null ? markupPercentage : BigDecimal.valueOf(15.0);
        BigDecimal targetMargin = targetGrossMarginPercentage != null ? targetGrossMarginPercentage : BigDecimal.valueOf(15.0);

        if (targetMargin.compareTo(BigDecimal.valueOf(100.0)) >= 0) {
            throw new BusinessRuleViolationException("Target gross margin percentage must be less than 100%");
        }

        // A. Markup-based Pricing: Recommended Price = Total Vehicle Cost * (1 + Markup / 100)
        // Expected Profit = Suggested Price - Total Cost
        // Gross Margin = (Expected Profit / Suggested Price) * 100
        BigDecimal markupFactor = BigDecimal.ONE.add(markup.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal suggestedPriceMarkup = totalCost.multiply(markupFactor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitMarkup = suggestedPriceMarkup.subtract(totalCost);
        BigDecimal grossMarginMarkup = BigDecimal.ZERO;
        if (suggestedPriceMarkup.compareTo(BigDecimal.ZERO) > 0) {
            grossMarginMarkup = profitMarkup.multiply(BigDecimal.valueOf(100)).divide(suggestedPriceMarkup, 2, RoundingMode.HALF_UP);
        }

        // B. Target Gross-Margin Pricing: Recommended Price = Total Vehicle Cost / (1 - Target Gross Margin / 100)
        // Expected Profit = Suggested Price - Total Cost
        BigDecimal marginDivisor = BigDecimal.ONE.subtract(targetMargin.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal suggestedPriceGrossMargin = BigDecimal.ZERO;
        if (marginDivisor.compareTo(BigDecimal.ZERO) > 0) {
            suggestedPriceGrossMargin = totalCost.divide(marginDivisor, 2, RoundingMode.HALF_UP);
        }
        BigDecimal profitGrossMargin = suggestedPriceGrossMargin.subtract(totalCost);
        BigDecimal grossMarginTarget = targetMargin.setScale(2, RoundingMode.HALF_UP);

        // Fetch market comparables
        List<MarketComparableEntity> comps = marketComparableRepository.findByVehicleIdOrderByObservationDateDesc(vehicleId);
        if (comps.isEmpty()) {
            comps = marketComparableRepository.findByMakeIgnoreCaseAndModelIgnoreCaseOrderByObservationDateDesc(vehicle.getBrand(), vehicle.getModel());
        }

        BigDecimal lowestPrice = null;
        BigDecimal medianPrice = null;
        BigDecimal highestPrice = null;
        LocalDate lastObsDate = null;
        String priceRange = "Insufficient market data";
        boolean warning = false;
        String warningMsg = null;

        if (!comps.isEmpty()) {
            List<BigDecimal> prices = comps.stream()
                    .map(MarketComparableEntity::getAskingPrice)
                    .sorted()
                    .collect(Collectors.toList());

            lowestPrice = prices.get(0);
            highestPrice = prices.get(prices.size() - 1);
            int mid = prices.size() / 2;
            if (prices.size() % 2 == 1) {
                medianPrice = prices.get(mid);
            } else {
                medianPrice = prices.get(mid - 1).add(prices.get(mid)).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            }

            lastObsDate = comps.get(0).getObservationDate();
            priceRange = "₹" + lowestPrice.toPlainString() + " - ₹" + highestPrice.toPlainString();

            // Discrepancy check: If target price exceeds highest observed market asking price
            if (suggestedPriceGrossMargin.compareTo(highestPrice) > 0) {
                warning = true;
                warningMsg = "Target margin price (₹" + suggestedPriceGrossMargin +
                        ") exceeds the highest observed market price (₹" + highestPrice + "). Consider reviewing refurbishment expenses or adjusting margin expectation.";
            }
        }

        return MarketPricingAnalysisResponse.builder()
                .vehicleId(vehicleId)
                .make(vehicle.getBrand())
                .model(vehicle.getModel())
                .variant(vehicle.getVariant())
                .manufacturingYear(vehicle.getManufacturingYear())
                .odometerReading(vehicle.getOdometerReading())
                .totalVehicleCost(totalCost)
                .markupPercentage(markup)
                .suggestedPriceMarkup(suggestedPriceMarkup)
                .expectedProfitMarkup(profitMarkup)
                .grossMarginPercentageMarkup(grossMarginMarkup)
                .targetGrossMarginPercentage(targetMargin)
                .suggestedPriceGrossMargin(suggestedPriceGrossMargin)
                .expectedProfitGrossMargin(profitGrossMargin)
                .grossMarginPercentageTarget(grossMarginTarget)
                .comparableListingsCount(comps.size())
                .lowestObservedAskingPrice(lowestPrice)
                .medianAskingPrice(medianPrice)
                .highestObservedAskingPrice(highestPrice)
                .lastObservationDate(lastObsDate)
                .competitivePriceRange(priceRange)
                .pricingWarning(warning)
                .warningMessage(warningMsg)
                .proposedSellingPrice(suggestedPriceGrossMargin.compareTo(BigDecimal.ZERO) > 0 ? suggestedPriceGrossMargin : suggestedPriceMarkup)
                .comparables(comps.stream().map(this::toComparableResponse).collect(Collectors.toList()))
                .build();
    }

    private MarketComparableResponse toComparableResponse(MarketComparableEntity e) {
        return MarketComparableResponse.builder()
                .id(e.getId())
                .vehicleId(e.getVehicle() != null ? e.getVehicle().getId() : null)
                .make(e.getMake())
                .model(e.getModel())
                .variant(e.getVariant())
                .manufacturingYear(e.getManufacturingYear())
                .registrationYear(e.getRegistrationYear())
                .fuelType(e.getFuelType())
                .transmission(e.getTransmission())
                .odometerReading(e.getOdometerReading())
                .vehicleCondition(e.getVehicleCondition())
                .location(e.getLocation())
                .askingPrice(e.getAskingPrice())
                .listingSource(e.getListingSource())
                .listingUrl(e.getListingUrl())
                .observationDate(e.getObservationDate())
                .notes(e.getNotes())
                .createdByUser(e.getCreatedByUser())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private ShopExpenseResponse toExpenseResponse(ShopExpenseEntity entity) {
        return ShopExpenseResponse.builder()
                .id(entity.getId())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .amount(entity.getAmount())
                .expenseDate(entity.getExpenseDate())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehicleRegistrationNumber(entity.getVehicle() != null ? entity.getVehicle().getRegistrationNumber() : null)
                .brokerId(entity.getBroker() != null ? entity.getBroker().getId() : null)
                .brokerName(entity.getBroker() != null ? entity.getBroker().getName() : null)
                .paymentMethod(entity.getPaymentMethod())
                .referenceNo(entity.getReferenceNo())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
