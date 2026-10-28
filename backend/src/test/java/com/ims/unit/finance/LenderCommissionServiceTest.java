package com.ims.unit.finance;

import com.ims.dtos.finance.LenderCommissionRequest;
import com.ims.dtos.finance.LenderCommissionResponse;
import com.ims.dtos.finance.LenderReceiptRequest;
import com.ims.entity.finance.FinanceApplicationEntity;
import com.ims.entity.finance.FinanceLenderEntity;
import com.ims.entity.finance.LenderCommissionEntity;
import com.ims.entity.finance.LenderCommissionReceiptEntity;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.repository.finance.FinanceApplicationRepository;
import com.ims.repository.finance.FinanceLenderRepository;
import com.ims.repository.finance.LenderCommissionReceiptRepository;
import com.ims.repository.finance.LenderCommissionRepository;
import com.ims.service.impl.finance.LenderCommissionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 13: Lender Commission Dynamic Calculation & Settlement Verification Tests")
class LenderCommissionServiceTest {

    @Mock
    private LenderCommissionRepository commissionRepository;

    @Mock
    private LenderCommissionReceiptRepository receiptRepository;

    @Mock
    private FinanceLenderRepository lenderRepository;

    @Mock
    private FinanceApplicationRepository applicationRepository;

    @InjectMocks
    private LenderCommissionServiceImpl commissionService;

    private FinanceLenderEntity testLender;
    private FinanceApplicationEntity testApp;

    @BeforeEach
    void setUp() {
        testLender = new FinanceLenderEntity();
        testLender.setId(10L);
        testLender.setName("HDFC Bank Car Finance");
        testLender.setLenderType("BANK");
        testLender.setDealerCommissionPercentage(new BigDecimal("80.00"));

        testApp = new FinanceApplicationEntity();
        testApp.setId(201L);
        testApp.setApplicationNumber("APP-2026-001");
        testApp.setStatus("DISBURSED");
        testApp.setRequestedLoanAmount(new BigDecimal("500000.00"));
        testApp.setDisbursedAmount(new BigDecimal("500000.00"));
        testApp.setProcessingFee(new BigDecimal("10000.00"));
        testApp.setApplicantName("Ravi Kumar");
        testApp.setApplicantPhone("9876543210");
        testApp.setLender(testLender);
    }

    @Test
    @DisplayName("Test 1: ₹5,00,000 disbursement at 1% calculates ₹5,000 gross; GST is excluded; TDS of 5% yields ₹4,750 net")
    void testDisbursementCommissionCalculation() {
        LenderCommissionRequest req = new LenderCommissionRequest();
        req.setCalculationMethod("PERCENTAGE_OF_DISBURSEMENT");
        req.setBaseAmount(new BigDecimal("500000.00"));
        req.setCommissionRatePercentage(new BigDecimal("1.00"));
        req.setTdsPercentage(new BigDecimal("5.00"));

        LenderCommissionResponse res = commissionService.calculateCommissionPreview(req);

        assertNotNull(res);
        assertEquals(0, new BigDecimal("5000.00").compareTo(res.getGrossCommission()), "Gross Commission must be ₹5,000.00");
        assertEquals(0, BigDecimal.ZERO.compareTo(res.getTaxAmount()), "GST must be strictly ₹0 (excluded from workflow)");
        assertEquals(0, new BigDecimal("250.00").compareTo(res.getTdsWithheld()), "5% TDS withholding must be ₹250.00");
        // Net receivable = 5000 - 250 = 4750 (GST completely excluded)
        assertEquals(0, new BigDecimal("4750.00").compareTo(res.getNetReceivable()), "Net receivable must be ₹4,750.00 without GST");
    }

    @Test
    @DisplayName("Test 2 & 3: ₹10,000 processing fee sharing calculates without GST; 0% TDS preserves full gross receivable")
    void testProcessingFeeSharingCalculation() {
        // 60% with no withholding -> Net Receivable = Gross Commission = ₹6,000
        LenderCommissionRequest req60 = new LenderCommissionRequest();
        req60.setCalculationMethod("PERCENTAGE_OF_PROCESSING_FEE");
        req60.setBaseAmount(new BigDecimal("10000.00"));
        req60.setCommissionRatePercentage(new BigDecimal("60.00"));
        req60.setTdsPercentage(BigDecimal.ZERO);

        LenderCommissionResponse res60 = commissionService.calculateCommissionPreview(req60);
        assertEquals(0, new BigDecimal("6000.00").compareTo(res60.getGrossCommission()), "60% of ₹10,000 must be ₹6,000.00");
        assertEquals(0, BigDecimal.ZERO.compareTo(res60.getTaxAmount()), "GST must be ₹0");
        assertEquals(0, BigDecimal.ZERO.compareTo(res60.getTdsWithheld()), "TDS must be ₹0");
        assertEquals(0, new BigDecimal("6000.00").compareTo(res60.getNetReceivable()), "Net receivable must be ₹6,000.00");

        // 80% with 5% approved withholding -> Gross: ₹8,000, TDS: ₹400, Net: ₹7,600
        LenderCommissionRequest req80 = new LenderCommissionRequest();
        req80.setCalculationMethod("PERCENTAGE_OF_PROCESSING_FEE");
        req80.setBaseAmount(new BigDecimal("10000.00"));
        req80.setCommissionRatePercentage(new BigDecimal("80.00"));
        req80.setTdsPercentage(new BigDecimal("5.00"));

        LenderCommissionResponse res80 = commissionService.calculateCommissionPreview(req80);
        assertEquals(0, new BigDecimal("8000.00").compareTo(res80.getGrossCommission()), "80% of ₹10,000 must be ₹8,000.00");
        assertEquals(0, BigDecimal.ZERO.compareTo(res80.getTaxAmount()), "GST must be strictly ₹0");
        assertEquals(0, new BigDecimal("400.00").compareTo(res80.getTdsWithheld()), "TDS 5% of ₹8,000 must be ₹400.00");
        assertEquals(0, new BigDecimal("7600.00").compareTo(res80.getNetReceivable()), "Net receivable must be ₹7,600.00");
    }

    @Test
    @DisplayName("Test 4: Fixed commission per loan uses configured amount with GST excluded")
    void testFixedCommissionRate() {
        LenderCommissionRequest req = new LenderCommissionRequest();
        req.setCalculationMethod("FIXED_PER_LOAN");
        req.setFixedCommissionRate(new BigDecimal("5000.00"));
        req.setTdsPercentage(BigDecimal.ZERO);

        LenderCommissionResponse res = commissionService.calculateCommissionPreview(req);
        assertEquals(0, new BigDecimal("5000.00").compareTo(res.getGrossCommission()), "Fixed gross must be ₹5,000");
        assertEquals(0, BigDecimal.ZERO.compareTo(res.getTaxAmount()), "GST must be ₹0");
        assertEquals(0, new BigDecimal("5000.00").compareTo(res.getNetReceivable()), "Fixed net must be ₹5,000");
    }

    @Test
    @DisplayName("Test 6: Undisbursed loan (PENDING) is not eligible for disbursement-based commission")
    void testUndisbursedLoanNotEligible() {
        testApp.setStatus("SUBMITTED");
        testApp.setDisbursedAmount(null);

        when(lenderRepository.findById(10L)).thenReturn(Optional.of(testLender));
        when(applicationRepository.findById(201L)).thenReturn(Optional.of(testApp));

        LenderCommissionRequest req = new LenderCommissionRequest();
        req.setLenderId(10L);
        req.setLoanApplicationId(201L);
        req.setCalculationMethod("PERCENTAGE_OF_DISBURSEMENT");
        req.setCommissionRatePercentage(new BigDecimal("1.00"));

        assertThrows(BusinessRuleViolationException.class, () -> commissionService.createCommissionEntry(req, "test_admin"),
                "Should fail because loan application is SUBMITTED and not disbursed");
    }

    @Test
    @DisplayName("Test 7: Duplicate commission for the same loan application is strictly prevented")
    void testDuplicateCommissionPrevention() {
        when(lenderRepository.findById(10L)).thenReturn(Optional.of(testLender));
        when(applicationRepository.findById(201L)).thenReturn(Optional.of(testApp));
        when(commissionRepository.findByLoanApplicationId(201L)).thenReturn(Optional.of(new LenderCommissionEntity()));

        LenderCommissionRequest req = new LenderCommissionRequest();
        req.setLenderId(10L);
        req.setLoanApplicationId(201L);
        req.setCalculationMethod("PERCENTAGE_OF_PROCESSING_FEE");
        req.setBaseAmount(new BigDecimal("10000.00"));
        req.setCommissionRatePercentage(new BigDecimal("80.00"));

        assertThrows(BusinessRuleViolationException.class, () -> commissionService.createCommissionEntry(req, "test_admin"),
                "Should reject duplicate commission entry for the same loan application");
    }

    @Test
    @DisplayName("Test 11 & 12: Partial partner receipts reconcile and update outstanding balance correctly")
    void testPartialSettlementReconciliation() {
        LenderCommissionEntity entity = new LenderCommissionEntity();
        entity.setId(55L);
        entity.setStatus("APPROVED");
        entity.setNetReceivable(new BigDecimal("9040.00"));
        entity.setAmountReceived(BigDecimal.ZERO);
        entity.setOutstandingBalance(new BigDecimal("9040.00"));

        when(commissionRepository.findById(55L)).thenReturn(Optional.of(entity));
        when(receiptRepository.save(any(LenderCommissionReceiptEntity.class))).thenAnswer(i -> i.getArgument(0));
        when(commissionRepository.save(any(LenderCommissionEntity.class))).thenAnswer(i -> i.getArgument(0));

        LenderReceiptRequest receiptReq = new LenderReceiptRequest();
        receiptReq.setReceiptDate(LocalDate.now());
        receiptReq.setTotalReceivedAmount(new BigDecimal("5000.00"));
        receiptReq.setPaymentMethod("BANK_TRANSFER");
        receiptReq.setBankUtrReference("HDFCUTR00123");

        LenderCommissionResponse res = commissionService.recordReceipt(55L, receiptReq, "accounts_mgr");

        assertEquals("PARTIALLY_SETTLED", res.getStatus(), "Status should be PARTIALLY_SETTLED");
        assertEquals(0, new BigDecimal("5000.00").compareTo(res.getAmountReceived()), "Amount received must be ₹5,000");
        assertEquals(0, new BigDecimal("4040.00").compareTo(res.getOutstandingBalance()), "Remaining outstanding must be ₹4,040");
    }
}
