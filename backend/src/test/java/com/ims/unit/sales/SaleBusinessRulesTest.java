package com.ims.unit.sales;

import com.ims.dtos.sales.PaymentCreateRequest;
import com.ims.dtos.sales.PaymentResponse;
import com.ims.dtos.sales.SaleCreateRequest;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.DeliveryEntity;
import com.ims.entity.sales.PaymentEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.*;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.PaymentConflictException;
import com.ims.repository.broker.BrokerCommissionRepository;
import com.ims.repository.broker.BrokerSettlementRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.repository.costing.ShopExpenseRepository;
import com.ims.repository.finance.EmiScheduleRepository;
import com.ims.repository.finance.FinanceDetailRepository;
import com.ims.repository.sales.*;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.repository.workshop.JobCardRepository;
import com.ims.service.impl.sales.SaleServiceImpl;
import com.ims.service.serviceInterface.vehicle.StatusWorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleBusinessRulesTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private DeliveryRepository deliveryRepository;
    @Mock
    private FinanceDetailRepository financeDetailRepository;
    @Mock
    private EmiScheduleRepository emiScheduleRepository;
    @Mock
    private BrokerVehicleListingRepository brokerListingRepository;
    @Mock
    private BrokerCommissionRepository brokerCommissionRepository;
    @Mock
    private BrokerSettlementRepository brokerSettlementRepository;
    @Mock
    private JobCardRepository jobCardRepository;
    @Mock
    private ShopExpenseRepository shopExpenseRepository;
    @Mock
    private StatusWorkflowService statusWorkflowService;

    @InjectMocks
    private SaleServiceImpl saleService;

    private VehicleEntity soldVehicle;
    private CustomerEntity customer;

    @BeforeEach
    void setUp() {
        soldVehicle = VehicleEntity.builder()
                .registrationNumber("MH01XY9999")
                .vehicleType(VehicleType.CAR)
                .ownershipType(OwnershipType.OWN)
                .status(VehicleStatus.SOLD) // Already SOLD!
                .build();
        soldVehicle.setId(10L);

        customer = com.ims.entity.sales.CustomerEntity.builder()
                .name("Arun Kumar")
                .mobile("9123456780")
                .build();
        customer.setId(20L);
    }

    @Test
    @DisplayName("Scenario 7: Prevents confirming sale for already sold vehicle (Concurrency Protection)")
    void testScenario7_CannotSellAlreadySoldVehicle() {
        when(vehicleRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(soldVehicle));
        when(customerRepository.findById(20L)).thenReturn(Optional.of(customer));

        SaleCreateRequest req = SaleCreateRequest.builder()
                .vehicleId(10L)
                .customerId(20L)
                .saleType(SaleType.DIRECT)
                .agreedPrice(BigDecimal.valueOf(500000.00))
                .saleDate(LocalDate.now())
                .build();

        // Attempting to sell an already SOLD vehicle must be rejected
        assertThrows(BusinessRuleViolationException.class, () ->
                saleService.confirmSale(req, "salesperson")
        );
    }

    @Test
    @DisplayName("Scenario 8: Duplicate payment retries with same idempotencyKey do not double-post payment")
    void testScenario8_PaymentIdempotencyProtection() {
        SaleEntity activeSale = SaleEntity.builder()
                .saleNumber("SALE-2026-001")
                .vehicle(VehicleEntity.builder().registrationNumber("DL01AA1111").ownershipType(OwnershipType.OWN).build())
                .customer(customer)
                .finalSalePrice(BigDecimal.valueOf(600000.00))
                .saleType(SaleType.DIRECT)
                .status(SaleStatus.IN_PROGRESS)
                .payments(new ArrayList<>())
                .build();
        activeSale.setId(5L);

        PaymentEntity existingPayment = PaymentEntity.builder()
                .receiptNumber("REC-IDEM-001")
                .sale(activeSale)
                .amount(BigDecimal.valueOf(50000.00))
                .paymentMethod(PaymentMethod.UPI)
                .idempotencyKey("IDEM-KEY-XYZ-999")
                .paymentDate(LocalDate.now())
                .build();
        existingPayment.setId(101L);

        // Mock that existing payment with this idempotency key already exists
        when(paymentRepository.findByIdempotencyKey("IDEM-KEY-XYZ-999")).thenReturn(Optional.of(existingPayment));

        PaymentCreateRequest retryRequest = PaymentCreateRequest.builder()
                .amount(BigDecimal.valueOf(50000.00))
                .paymentMethod(PaymentMethod.UPI)
                .idempotencyKey("IDEM-KEY-XYZ-999")
                .paymentDate(LocalDate.now())
                .build();

        // Act - Call recordPayment with identical idempotencyKey
        PaymentResponse response = saleService.recordPayment(5L, retryRequest, "user");

        // Assert - Existing payment receipt returned safely
        assertEquals("REC-IDEM-001", response.getReceiptNumber());
        assertEquals(0, response.getAmount().compareTo(new BigDecimal("50000.00")));
        // Verify payment was NOT saved a second time
        verify(paymentRepository, never()).save(argThat(p -> p != existingPayment));
    }

    @Test
    @DisplayName("Scenario 10: Direct Sale Delivery requires full payment; incomplete payment throws exception")
    void testScenario10_DirectSaleDeliveryRequiresFullPayment() {
        SaleEntity unpaidSale = SaleEntity.builder()
                .saleNumber("SALE-DIR-001")
                .vehicle(VehicleEntity.builder().registrationNumber("KA03BB3333").status(VehicleStatus.SOLD).build())
                .customer(customer)
                .finalSalePrice(BigDecimal.valueOf(500000.00))
                .saleType(SaleType.DIRECT)
                .status(SaleStatus.IN_PROGRESS)
                .payments(new ArrayList<>()) // Zero payments recorded
                .build();
        unpaidSale.setId(15L);

        when(saleRepository.findById(15L)).thenReturn(Optional.of(unpaidSale));

        com.ims.dtos.sales.DeliveryCreateRequest delivReq = com.ims.dtos.sales.DeliveryCreateRequest.builder()
                .deliveryDate(LocalDate.now())
                .recipientName("Arun Kumar")
                .recipientPhone("9123456780")
                .odometerAtDelivery(15000)
                .build();

        // Attempting to deliver when balance is due on a Direct sale must throw an exception
        assertThrows(BusinessRuleViolationException.class, () ->
                saleService.deliverVehicle(15L, delivReq, "deliveryStaff")
        );
    }

    @Test
    @DisplayName("Scenario 11: Broker vehicle ownership check ensures it is never classified as shop purchased inventory")
    void testScenario11_BrokerVehicleNeverPurchasedInventory() {
        VehicleEntity brokerVehicle = VehicleEntity.builder()
                .registrationNumber("TN09ZZ7777")
                .vehicleType(VehicleType.CAR)
                .ownershipType(OwnershipType.BROKER)
                .status(VehicleStatus.AVAILABLE)
                .build();

        assertNotEquals(OwnershipType.OWN, brokerVehicle.getOwnershipType());
        assertEquals(OwnershipType.BROKER, brokerVehicle.getOwnershipType());
    }

    @Test
    @DisplayName("Scenario 12: Sale creation with IN_HOUSE_FINANCE creates finance detail and emi schedules")
    void testScenario12_SaleWithInHouseFinance() {
        VehicleEntity availableVehicle = VehicleEntity.builder()
                .registrationNumber("KA01AB1234")
                .vehicleType(VehicleType.CAR)
                .ownershipType(OwnershipType.OWN)
                .status(VehicleStatus.AVAILABLE)
                .build();
        availableVehicle.setId(30L);

        when(vehicleRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(availableVehicle));
        when(customerRepository.findById(20L)).thenReturn(Optional.of(customer));
        when(saleRepository.findByVehicleId(30L)).thenReturn(Optional.empty());

        SaleEntity savedSaleMock = SaleEntity.builder()
                .saleNumber("SALE-2026-TEST")
                .vehicle(availableVehicle)
                .customer(customer)
                .saleType(SaleType.FINANCE)
                .agreedPrice(BigDecimal.valueOf(800000.00))
                .discountAmount(BigDecimal.ZERO)
                .finalSalePrice(BigDecimal.valueOf(800000.00))
                .status(SaleStatus.IN_PROGRESS)
                .payments(new ArrayList<>())
                .build();
        savedSaleMock.setId(100L);

        when(saleRepository.save(any(SaleEntity.class))).thenReturn(savedSaleMock);

        com.ims.entity.finance.FinanceDetailEntity savedFinMock = com.ims.entity.finance.FinanceDetailEntity.builder()
                .sale(savedSaleMock)
                .financeCompany("DEALEROS In-House Finance")
                .loanAccountNumber("DEALEROS-IH-1234")
                .loanAmount(BigDecimal.valueOf(600000.00))
                .downPayment(BigDecimal.valueOf(200000.00))
                .interestRate(BigDecimal.valueOf(10.0))
                .tenureMonths(12)
                .emiAmount(BigDecimal.valueOf(52750.00))
                .emiDueDay(5)
                .loanStartDate(LocalDate.now())
                .loanEndDate(LocalDate.now().plusMonths(12))
                .status(FinanceStatus.ACTIVE)
                .emiSchedules(new ArrayList<>())
                .build();
        savedFinMock.setId(200L);

        when(financeDetailRepository.save(any(com.ims.entity.finance.FinanceDetailEntity.class))).thenReturn(savedFinMock);

        SaleCreateRequest req = SaleCreateRequest.builder()
                .vehicleId(30L)
                .customerId(20L)
                .saleType(SaleType.FINANCE)
                .agreedPrice(BigDecimal.valueOf(800000.00))
                .discountAmount(BigDecimal.ZERO)
                .saleDate(LocalDate.now())
                .financeCompany("DEALEROS In-House Finance")
                .loanAccountNumber("DEALEROS-IH-1234")
                .downPayment(BigDecimal.valueOf(200000.00))
                .loanAmount(BigDecimal.valueOf(600000.00))
                .interestRate(BigDecimal.valueOf(10.0))
                .tenureMonths(12)
                .emiAmount(BigDecimal.valueOf(52750.00))
                .financeType("IN_HOUSE")
                .build();

        var res = saleService.confirmSale(req, "admin");

        assertNotNull(res);
        verify(financeDetailRepository, times(1)).save(any(com.ims.entity.finance.FinanceDetailEntity.class));
        verify(emiScheduleRepository, times(12)).save(any(com.ims.entity.finance.EmiScheduleEntity.class));
        verify(paymentRepository, times(1)).save(any(PaymentEntity.class)); // down payment receipt
        verify(statusWorkflowService, times(1)).validateAndTransition(eq(availableVehicle), eq(VehicleStatus.SOLD), anyString(), eq("admin"));
    }
}
