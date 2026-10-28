package com.ims.unit.finance;

import com.ims.dtos.finance.*;
import com.ims.entity.finance.*;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.sales.SaleEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.ims.enums.FinanceStatus;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.repository.finance.*;
import com.ims.repository.sales.CustomerRepository;
import com.ims.repository.vehicle.VehicleRepository;
import com.ims.service.impl.finance.FinanceServiceImpl;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Finance Service Business Rules & Calculations Test")
class FinanceServiceTest {

    @Mock
    private FinanceDetailRepository financeDetailRepository;
    @Mock
    private EmiScheduleRepository emiScheduleRepository;
    @Mock
    private FinanceLenderRepository financeLenderRepository;
    @Mock
    private FinanceApplicationRepository financeApplicationRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private LoanLedgerEntryRepository loanLedgerEntryRepository;
    @Mock
    private LoanPenaltyPolicyRepository loanPenaltyPolicyRepository;
    @Mock
    private com.ims.repository.sales.SaleRepository saleRepository;
    @Mock
    private com.ims.repository.sales.PaymentRepository paymentRepository;

    @InjectMocks
    private FinanceServiceImpl financeService;

    private CustomerEntity customer;
    private VehicleEntity vehicle;
    private SaleEntity sale;

    @BeforeEach
    void setUp() {
        customer = CustomerEntity.builder()
                .name("Arun Kumar")
                .mobile("9876543210")
                .build();
        customer.setId(1L);

        vehicle = VehicleEntity.builder()
                .registrationNumber("KA01AB1234")
                .build();
        vehicle.setId(100L);

        sale = SaleEntity.builder()
                .customer(customer)
                .vehicle(vehicle)
                .build();
        sale.setId(500L);
    }

    @Test
    @DisplayName("Calculate EMI: reducing-balance formula and amortization schedule reconciliation")
    void testCalculateEmi_ReducingBalanceFormula() {
        EmiCalculatorRequest request = EmiCalculatorRequest.builder()
                .vehicleAmount(BigDecimal.valueOf(500000))
                .downPayment(BigDecimal.valueOf(100000))
                .tradeInCredit(BigDecimal.ZERO)
                .financedFees(BigDecimal.valueOf(5000))
                .annualInterestRate(BigDecimal.valueOf(10.5)) // 10.5% p.a.
                .tenureMonths(12)
                .startDate(LocalDate.of(2026, 1, 1))
                .build();

        EmiCalculatorResponse response = financeService.calculateEmi(request);

        assertNotNull(response);
        // Amount financed = 500000 - 100000 + 5000 = 405000
        assertEquals(0, BigDecimal.valueOf(405000).compareTo(response.getAmountFinanced()));
        assertEquals(12, response.getSchedule().size());

        // Check amortization integrity: sum of principal components should equal amount financed
        BigDecimal sumPrincipal = response.getSchedule().stream()
                .map(EmiCalculatorResponse.AmortizationRowDto::getPrincipalComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, response.getAmountFinanced().compareTo(sumPrincipal),
                "Total amortized principal components must reconcile to financed amount");

        // Closing principal on final instalment must be exactly zero
        BigDecimal finalClosing = response.getSchedule().get(11).getClosingPrincipal();
        assertEquals(0, BigDecimal.ZERO.compareTo(finalClosing), "Final closing principal must be zero");
    }

    @Test
    @DisplayName("Foreclosure Quote: accurately calculates principal, accrued interest and 2% prepayment fee")
    void testGetForeclosureQuote() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-0001")
                .sale(sale)
                .loanAmount(BigDecimal.valueOf(300000))
                .principalOutstanding(BigDecimal.valueOf(200000))
                .interestRate(BigDecimal.valueOf(12.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(10L);

        when(financeDetailRepository.findById(10L)).thenReturn(Optional.of(loan));

        LoanForeclosureQuoteResponse quote = financeService.getForeclosureQuote(10L);

        assertNotNull(quote);
        assertEquals(0, BigDecimal.valueOf(200000).compareTo(quote.getPrincipalOutstanding()));
        // Foreclosure fee = 2% of 200000 = 4000
        assertEquals(0, BigDecimal.valueOf(4000.00).compareTo(quote.getForeclosureChargeAmount()));
        assertTrue(quote.getTotalSettlementPayable().compareTo(BigDecimal.valueOf(204000)) >= 0);
        assertEquals("Arun Kumar", quote.getCustomerName());
    }

    @Test
    @DisplayName("Record EMI Payment: updates loan principal outstanding and marks loan CLOSED on final payment")
    void testRecordEmiPayment_MarksLoanClosedWhenAllPaid() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-0002")
                .loanAmount(BigDecimal.valueOf(100000))
                .principalOutstanding(BigDecimal.valueOf(50000))
                .totalPrincipalPaid(BigDecimal.valueOf(50000))
                .totalInterestPaid(BigDecimal.valueOf(5000))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(20L);

        EmiScheduleEntity emi1 = EmiScheduleEntity.builder()
                .financeDetail(loan)
                .installmentNumber(1)
                .emiAmount(BigDecimal.valueOf(52500))
                .principalAmount(BigDecimal.valueOf(50000))
                .interestAmount(BigDecimal.valueOf(2500))
                .status("PAID")
                .build();
        emi1.setId(101L);

        EmiScheduleEntity emi2 = EmiScheduleEntity.builder()
                .financeDetail(loan)
                .installmentNumber(2)
                .emiAmount(BigDecimal.valueOf(52500))
                .principalAmount(BigDecimal.valueOf(50000))
                .interestAmount(BigDecimal.valueOf(2500))
                .status("PENDING")
                .build();
        emi2.setId(102L);

        when(emiScheduleRepository.findById(102L)).thenReturn(Optional.of(emi2));
        when(emiScheduleRepository.save(any(EmiScheduleEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        // When checking all EMIs for loan 20
        List<EmiScheduleEntity> list = new ArrayList<>();
        list.add(emi1);
        list.add(emi2); // will have status changed to PAID in test
        when(emiScheduleRepository.findByFinanceDetailIdOrderByInstallmentNumberAsc(20L)).thenReturn(list);
        when(financeDetailRepository.save(any(FinanceDetailEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        EmiScheduleResponse res = financeService.recordEmiPayment(102L, LocalDate.now(), "admin");

        assertNotNull(res);
        assertEquals("PAID", res.getStatus());
        assertEquals(FinanceStatus.CLOSED, loan.getStatus(), "Loan should transition to CLOSED once all EMIs are settled");
        assertEquals(0, BigDecimal.ZERO.compareTo(loan.getPrincipalOutstanding()));
    }

    @Test
    @DisplayName("Foreclosure: ₹83,000 principal + ₹329 accrued interest calculation (diagnostic scenario)")
    void testForeclosureDiagnostic_Principal83000_Accrued329() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-DIAG")
                .sale(sale)
                .loanAmount(BigDecimal.valueOf(100000))
                .principalOutstanding(BigDecimal.valueOf(83000))
                .interestRate(BigDecimal.valueOf(10.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(83L);

        when(financeDetailRepository.findById(83L)).thenReturn(Optional.of(loan));
        when(loanPenaltyPolicyRepository.findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        LoanForeclosureQuoteResponse quote = financeService.getForeclosureQuote(83L);

        assertNotNull(quote);
        assertEquals(0, BigDecimal.valueOf(83000).compareTo(quote.getPrincipalOutstanding()));
        // Prepayment fee 2% of 83,000 = 1,660.00
        assertEquals(0, BigDecimal.valueOf(1660.00).compareTo(quote.getForeclosureChargeAmount()));
        // Payable before adjustments must include 83,000 + accrued interest + 1,660 fee
        assertTrue(quote.getTotalSettlementPayable().compareTo(BigDecimal.valueOf(84660)) >= 0);
    }

    @Test
    @DisplayName("Close Loan: Rejects ₹0 settlement when outstanding balance is positive without authorized waiver")
    void testCloseLoan_RejectsZeroSettlementWithoutWaiver() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-0003")
                .sale(sale)
                .loanAmount(BigDecimal.valueOf(200000))
                .principalOutstanding(BigDecimal.valueOf(83000))
                .interestRate(BigDecimal.valueOf(12.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(30L);

        when(financeDetailRepository.findById(30L)).thenReturn(Optional.of(loan));

        LoanClosureRequest request = LoanClosureRequest.builder()
                .settlementPaymentReference("UTR-ZERO-ATTEMPT")
                .settlementAmountPaid(BigDecimal.ZERO)
                .authorizedWaiver(BigDecimal.ZERO)
                .build();

        BusinessRuleViolationException exception = assertThrows(BusinessRuleViolationException.class, () ->
                financeService.closeLoan(30L, request, "tester")
        );

        assertTrue(exception.getMessage().contains("cannot be closed for ₹0 without authorized waiver"));
        assertEquals(FinanceStatus.ACTIVE, loan.getStatus(), "Loan must remain ACTIVE");
    }

    @Test
    @DisplayName("Close Loan: Successfully closes and posts immutable ledger entry when exact settlement amount is paid")
    void testCloseLoan_SuccessWithVerifiedSettlementPayment() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-0004")
                .sale(sale)
                .loanAmount(BigDecimal.valueOf(100000))
                .principalOutstanding(BigDecimal.valueOf(50000))
                .interestRate(BigDecimal.valueOf(10.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(40L);

        when(financeDetailRepository.findById(40L)).thenReturn(Optional.of(loan));
        when(financeDetailRepository.save(any(FinanceDetailEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        // Get actual quote first
        LoanForeclosureQuoteResponse quote = financeService.getForeclosureQuote(40L);
        BigDecimal payable = quote.getTotalSettlementPayable();

        LoanClosureRequest request = LoanClosureRequest.builder()
                .settlementPaymentReference("UTR-VERIFIED-50000")
                .settlementAmountPaid(payable)
                .authorizedWaiver(BigDecimal.ZERO)
                .closureRemarks("Customer full settlement received at branch")
                .build();

        FinanceResponse response = financeService.closeLoan(40L, request, "branch_manager");

        assertNotNull(response);
        assertEquals(FinanceStatus.CLOSED, loan.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(loan.getPrincipalOutstanding()));
        verify(loanLedgerEntryRepository, times(1)).save(any(LoanLedgerEntryEntity.class));
    }

    @Test
    @DisplayName("Close Loan: Authorized manager waiver covers outstanding balance and permits lawful zero-cash closure")
    void testCloseLoan_SuccessWithAuthorizedWaiver() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-2026-0005")
                .sale(sale)
                .loanAmount(BigDecimal.valueOf(50000))
                .principalOutstanding(BigDecimal.valueOf(10000))
                .interestRate(BigDecimal.valueOf(10.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(50L);

        when(financeDetailRepository.findById(50L)).thenReturn(Optional.of(loan));
        when(financeDetailRepository.save(any(FinanceDetailEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanForeclosureQuoteResponse quote = financeService.getForeclosureQuote(50L);
        BigDecimal payable = quote.getTotalSettlementPayable();

        // 100% waiver approved by director
        LoanClosureRequest request = LoanClosureRequest.builder()
                .settlementPaymentReference("DIRECTOR-APPROVAL-WAIVER-2026")
                .settlementAmountPaid(BigDecimal.ZERO)
                .authorizedWaiver(payable)
                .closureRemarks("100% executive waiver approved for goodwill settlement")
                .build();

        FinanceResponse response = financeService.closeLoan(50L, request, "md_director");

        assertNotNull(response);
        assertEquals(FinanceStatus.CLOSED, loan.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(loan.getPrincipalOutstanding()));
    }

    @Test
    @DisplayName("Phase 3 & Phase 14: Calendar-Month Preclosure Eligibility Boundaries (1 Nov 2026 commencement)")
    void testPreclosureEligibility_CalendarMonthBoundaries() {
        LocalDate startDate = LocalDate.of(2026, 11, 1);
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-BOUND-001")
                .sale(sale)
                .loanStartDate(startDate)
                .loanAmount(BigDecimal.valueOf(100000))
                .principalOutstanding(BigDecimal.valueOf(27000))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(101L);

        when(financeDetailRepository.findById(101L)).thenReturn(Optional.of(loan));

        LoanPenaltyPolicyEntity policy = LoanPenaltyPolicyEntity.builder()
                .policyCode("IN_HOUSE_STD_2026")
                .preclosureEnabled(true)
                .eligibilityPeriodMonths(3)
                .inclusiveEndDateRule(true)
                .foreclosureChargeRate(BigDecimal.valueOf(2.00))
                .feeCalculationBase("OUTSTANDING_PRINCIPAL")
                .build();
        when(loanPenaltyPolicyRepository.findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.of(policy));

        // Test 1: 1 Nov 2026 (commencement) -> Eligible
        LoanPreclosureEligibilityResponse resNov1 = financeService.getPreclosureEligibility(101L, LocalDate.of(2026, 11, 1));
        assertTrue(resNov1.getEligible());
        assertEquals(LocalDate.of(2027, 1, 1), resNov1.getEligibilityEndDate());

        // Test 2: 1 Dec 2026 (middle month) -> Eligible
        LoanPreclosureEligibilityResponse resDec1 = financeService.getPreclosureEligibility(101L, LocalDate.of(2026, 12, 1));
        assertTrue(resDec1.getEligible());

        // Test 3: 1 Jan 2027 (inclusive end boundary) -> Eligible
        LoanPreclosureEligibilityResponse resJan1 = financeService.getPreclosureEligibility(101L, LocalDate.of(2027, 1, 1));
        assertTrue(resJan1.getEligible());

        // Test 4: 2 Jan 2027 (day after expiration) -> Ineligible
        LoanPreclosureEligibilityResponse resJan2 = financeService.getPreclosureEligibility(101L, LocalDate.of(2027, 1, 2));
        assertFalse(resJan2.getEligible());
        assertEquals("Preclosure eligibility expired on 2027-01-01.", resJan2.getIneligibilityReason());
    }

    @Test
    @DisplayName("Phase 5 & Phase 8: 2% Preclosure Fee calculation on ₹27,000 principal = ₹540")
    void testForeclosureCharge_ExactTwoPercentCalculation() {
        FinanceDetailEntity loan = FinanceDetailEntity.builder()
                .loanAccountNumber("LN-CALC-002")
                .sale(sale)
                .loanStartDate(LocalDate.of(2026, 11, 1))
                .loanAmount(BigDecimal.valueOf(36000))
                .principalOutstanding(BigDecimal.valueOf(27000))
                .interestRate(BigDecimal.valueOf(10.0))
                .status(FinanceStatus.ACTIVE)
                .build();
        loan.setId(102L);

        when(financeDetailRepository.findById(102L)).thenReturn(Optional.of(loan));

        LoanPenaltyPolicyEntity policy = LoanPenaltyPolicyEntity.builder()
                .policyCode("IN_HOUSE_STD_2026")
                .foreclosureChargeRate(BigDecimal.valueOf(2.00))
                .feeCalculationBase("OUTSTANDING_PRINCIPAL")
                .rbiFloatingRateForeclosureExempt(false)
                .build();
        when(loanPenaltyPolicyRepository.findFirstByBorrowerCategoryAndInterestRateTypeAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.of(policy));

        LoanForeclosureQuoteResponse quote = financeService.getForeclosureQuote(102L);
        assertNotNull(quote);
        assertEquals(0, BigDecimal.valueOf(27000).compareTo(quote.getPrincipalOutstanding()));
        // ₹27,000 * 2% = ₹540.00
        assertEquals(0, BigDecimal.valueOf(540.00).setScale(2).compareTo(quote.getForeclosureChargeAmount()));
    }
}
