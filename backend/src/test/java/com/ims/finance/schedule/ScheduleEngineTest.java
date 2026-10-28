package com.ims.finance.schedule;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class ScheduleEngineTest {

    @Test
    @DisplayName("Acceptance Test: ₹70,000 at 10% p.a. over 24 months")
    void testAcceptanceCriteria70kLoan() {
        BigDecimal principal = new BigDecimal("70000.00");
        BigDecimal annualRate = new BigDecimal("10.000000");
        int tenureMonths = 24;
        LocalDate startDate = LocalDate.of(2026, 1, 1);

        ScheduleEngine.AmortizationResult result = ScheduleEngine.generateAmortizationSchedule(
                principal, annualRate, tenureMonths, startDate
        );

        // 1. Verify Monthly EMI computed from the formula with HALF_UP (3230.14)
        BigDecimal expectedEmi = ScheduleEngine.calculateReducingEmi(principal, annualRate, tenureMonths);
        assertEquals(expectedEmi, result.monthlyEmi(), "Monthly EMI must match formula computed value");
        assertTrue(result.monthlyEmi().compareTo(new BigDecimal("3230.14")) == 0 || result.monthlyEmi().compareTo(new BigDecimal("3230.15")) == 0,
                "Monthly EMI should be between 3230.14 and 3230.15 depending on rounding mode");

        // 2. Verify Installment 1 calculations
        ScheduleEngine.InstallmentPlan inst1 = result.schedule().get(0);
        assertEquals(1, inst1.installmentNumber());
        assertEquals(new BigDecimal("70000.00"), inst1.openingPrincipal());
        assertEquals(new BigDecimal("583.33"), inst1.interestAmount(), "First month interest must be 583.33");
        assertEquals(result.monthlyEmi().subtract(inst1.interestAmount()), inst1.principalAmount(), "First month principal repaid matches emi - interest");
        assertEquals(principal.subtract(inst1.principalAmount()), inst1.closingPrincipal(), "Outstanding principal after inst 1 matches principal - p1");

        // 3. Verify Amortization Invariant: Sum of principal repaid equals original disbursed principal
        BigDecimal totalPrincipalRepaid = result.schedule().stream()
                .map(ScheduleEngine.InstallmentPlan::principalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(principal, totalPrincipalRepaid, "Total principal repaid must equal original principal");

        // 4. Verify Final closing principal is 0.00
        ScheduleEngine.InstallmentPlan lastInst = result.schedule().get(tenureMonths - 1);
        assertEquals(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), lastInst.closingPrincipal());
    }

    @Test
    @DisplayName("Zero Interest Rate Test")
    void testZeroInterest() {
        BigDecimal principal = new BigDecimal("12000.00");
        BigDecimal annualRate = BigDecimal.ZERO;
        int tenureMonths = 12;

        ScheduleEngine.AmortizationResult result = ScheduleEngine.generateAmortizationSchedule(
                principal, annualRate, tenureMonths, LocalDate.now()
        );

        assertEquals(new BigDecimal("1000.00"), result.monthlyEmi());
        assertEquals(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), result.totalInterest());
    }
}
