package com.ims.finance.schedule;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Pure BigDecimal authoritative Amortization & Repayment Schedule Engine.
 * 
 * Complies with strict banking standards:
 * - Scale 2 for currency, Scale 6 for rates.
 * - RoundingMode.HALF_UP.
 * - Zero double/float primitives in financial calculations.
 * - Final installment absorbs rounding residual paise.
 */
public class ScheduleEngine {

    private static final BigDecimal TWELVE_HUNDRED = BigDecimal.valueOf(1200);

    public record InstallmentPlan(
            int installmentNumber,
            LocalDate dueDate,
            BigDecimal openingPrincipal,
            BigDecimal principalAmount,
            BigDecimal interestAmount,
            BigDecimal emiAmount,
            BigDecimal closingPrincipal
    ) {}

    public record AmortizationResult(
            BigDecimal monthlyEmi,
            BigDecimal totalInterest,
            BigDecimal totalPayment,
            List<InstallmentPlan> schedule
    ) {}

    /**
     * Calculates the monthly reducing-balance EMI using the standard banking formula:
     * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
     * where r = annualRate / 1200
     */
    public static BigDecimal calculateReducingEmi(BigDecimal principal, BigDecimal annualRatePercentage, int tenureMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || tenureMonths <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (annualRatePercentage == null || annualRatePercentage.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        // r = annualRate / 1200 (scale 10 for precision during intermediate exponentiation)
        BigDecimal monthlyRate = annualRatePercentage.divide(TWELVE_HUNDRED, 10, RoundingMode.HALF_UP);

        // factor = (1 + r)^n
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal factor = onePlusR.pow(tenureMonths);

        // numerator = P * r * (1 + r)^n
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(factor);

        // denominator = (1 + r)^n - 1
        BigDecimal denominator = factor.subtract(BigDecimal.ONE);

        // Standard banking reducing-balance formula
        // Note: Mathematical exact value of (70000 * (10/1200) * (1+10/1200)^24) / ((1+10/1200)^24 - 1) is 3230.1448...
        // Standard RoundingMode.HALF_UP yields 3230.14. If configured with RoundingMode.CEILING or paise adjustment it yields 3230.15.
        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /**
     * Generates a complete amortization schedule.
     */
    public static AmortizationResult generateAmortizationSchedule(
            BigDecimal principal,
            BigDecimal annualRatePercentage,
            int tenureMonths,
            LocalDate commencementDate
    ) {
        BigDecimal emi = calculateReducingEmi(principal, annualRatePercentage, tenureMonths);
        BigDecimal monthlyRate = annualRatePercentage.divide(TWELVE_HUNDRED, 10, RoundingMode.HALF_UP);

        List<InstallmentPlan> schedule = new ArrayList<>(tenureMonths);
        BigDecimal currentPrincipal = principal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInterest = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPayment = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        LocalDate startDate = commencementDate != null ? commencementDate : LocalDate.now();

        for (int i = 1; i <= tenureMonths; i++) {
            LocalDate dueDate = startDate.plusMonths(i);
            BigDecimal opening = currentPrincipal;

            // Interest for the month = opening * r
            BigDecimal interest = opening.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal scheduledPrincipal = emi.subtract(interest);
            BigDecimal installmentEmi = emi;

            // Final installment absorbs residual paise
            if (i == tenureMonths || scheduledPrincipal.compareTo(opening) > 0) {
                scheduledPrincipal = opening;
                installmentEmi = scheduledPrincipal.add(interest);
            }

            BigDecimal closing = opening.subtract(scheduledPrincipal);
            if (closing.compareTo(BigDecimal.ZERO) < 0) {
                closing = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            }

            schedule.add(new InstallmentPlan(
                    i,
                    dueDate,
                    opening,
                    scheduledPrincipal,
                    interest,
                    installmentEmi,
                    closing
            ));

            currentPrincipal = closing;
            totalInterest = totalInterest.add(interest);
            totalPayment = totalPayment.add(installmentEmi);
        }

        return new AmortizationResult(emi, totalInterest, totalPayment, schedule);
    }
}
