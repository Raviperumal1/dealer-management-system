package com.ims.unit.broker;

import com.ims.dtos.broker.SettlementPaymentRequest;
import com.ims.dtos.broker.SettlementResponse;
import com.ims.entity.broker.BrokerEntity;
import com.ims.entity.broker.BrokerSettlementEntity;
import com.ims.entity.broker.BrokerSettlementPaymentEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.PaymentMethod;
import com.ims.enums.SettlementStatus;
import com.ims.exception.PaymentConflictException;
import com.ims.mapper.BrokerMapper;
import com.ims.repository.broker.BrokerRepository;
import com.ims.repository.broker.BrokerSettlementPaymentRepository;
import com.ims.repository.broker.BrokerSettlementRepository;
import com.ims.repository.broker.BrokerVehicleListingRepository;
import com.ims.service.impl.broker.BrokerServiceImpl;
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
class BrokerSettlementTest {

    @Mock
    private BrokerRepository brokerRepository;
    @Mock
    private BrokerVehicleListingRepository listingRepository;
    @Mock
    private BrokerSettlementRepository settlementRepository;
    @Mock
    private BrokerSettlementPaymentRepository settlementPaymentRepository;
    @Mock
    private BrokerMapper brokerMapper;

    @InjectMocks
    private BrokerServiceImpl brokerService;

    private BrokerSettlementEntity settlement;

    @BeforeEach
    void setUp() {
        BrokerEntity broker = BrokerEntity.builder().name("Raj").mobile("9876543210").build();
        broker.setId(10L);

        VehicleEntity vehicle = VehicleEntity.builder().registrationNumber("TN02CD5678").build();
        vehicle.setId(20L);

        // Net payable = ₹7,75,000, initial paid = 0, balance = ₹7,75,000
        settlement = BrokerSettlementEntity.builder()
                .broker(broker)
                .vehicle(vehicle)
                .saleId(101L)
                .saleAmount(BigDecimal.valueOf(800000.00))
                .brokerAmount(BigDecimal.valueOf(775000.00))
                .grossCommission(BigDecimal.valueOf(25000.00))
                .otherDeductions(BigDecimal.ZERO)
                .netPayable(BigDecimal.valueOf(775000.00))
                .paidAmount(BigDecimal.ZERO)
                .balanceAmount(BigDecimal.valueOf(775000.00))
                .settlementStatus(SettlementStatus.PENDING)
                .payments(new ArrayList<>())
                .build();
        settlement.setId(1L);
    }

    @Test
    @DisplayName("Scenario 6: Partial broker settlements update remaining balance accurately")
    void testScenario6_PartialBrokerSettlement() {
        when(settlementRepository.findById(1L)).thenReturn(Optional.of(settlement));
        when(settlementPaymentRepository.save(any(BrokerSettlementPaymentEntity.class))).thenAnswer(i -> i.getArgument(0));
        when(settlementRepository.save(any(BrokerSettlementEntity.class))).thenAnswer(i -> i.getArgument(0));

        SettlementResponse mockResp = SettlementResponse.builder()
                .id(1L)
                .settlementStatus(SettlementStatus.PARTIALLY_PAID)
                .paidAmount(BigDecimal.valueOf(500000.00))
                .balanceAmount(BigDecimal.valueOf(275000.00))
                .build();
        when(brokerMapper.toSettlementResponse(any(BrokerSettlementEntity.class))).thenReturn(mockResp);

        // 1st Partial Payment: ₹5,00,000
        SettlementPaymentRequest p1 = SettlementPaymentRequest.builder()
                .amount(BigDecimal.valueOf(500000.00))
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentReference("RTGS-001")
                .build();

        SettlementResponse r1 = brokerService.recordSettlementPayment(1L, p1);

        // Verify status and balance
        assertEquals(SettlementStatus.PARTIALLY_PAID, settlement.getSettlementStatus());
        assertEquals(0, settlement.getPaidAmount().compareTo(new BigDecimal("500000.00")));
        assertEquals(0, settlement.getBalanceAmount().compareTo(new BigDecimal("275000.00")));

        // 2nd Payment: Final balance of ₹275,000
        SettlementPaymentRequest p2 = SettlementPaymentRequest.builder()
                .amount(BigDecimal.valueOf(275000.00))
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentReference("RTGS-002")
                .build();

        brokerService.recordSettlementPayment(1L, p2);

        // Verify fully paid
        assertEquals(SettlementStatus.PAID, settlement.getSettlementStatus());
        assertEquals(0, settlement.getPaidAmount().compareTo(new BigDecimal("775000.00")));
        assertEquals(0, settlement.getBalanceAmount().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("Overpayment Prevention: Rejects payment exceeding outstanding balance")
    void testOverpaymentRejection() {
        when(settlementRepository.findById(1L)).thenReturn(Optional.of(settlement));

        SettlementPaymentRequest overpay = SettlementPaymentRequest.builder()
                .amount(BigDecimal.valueOf(800000.00)) // Balance is 7,75,000
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .build();

        assertThrows(PaymentConflictException.class, () ->
                brokerService.recordSettlementPayment(1L, overpay)
        );
    }
}
