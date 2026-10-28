-- V6__configurable_preclosure_policy_and_eligibility.sql
-- DEALEROS Preclosure Policy Configuration Engine & Eligibility Boundaries

ALTER TABLE loan_penalty_policies
    ADD COLUMN preclosure_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN eligibility_period_months INT NOT NULL DEFAULT 3,
    ADD COLUMN eligibility_start_basis VARCHAR(50) NOT NULL DEFAULT 'COMMENCEMENT_DATE', -- COMMENCEMENT_DATE, FIRST_DISBURSEMENT_DATE
    ADD COLUMN inclusive_end_date_rule BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN fee_calculation_base VARCHAR(50) NOT NULL DEFAULT 'OUTSTANDING_PRINCIPAL', -- OUTSTANDING_PRINCIPAL, SANCTIONED_AMOUNT
    ADD COLUMN min_foreclosure_fee DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN max_foreclosure_fee DECIMAL(14,2) NOT NULL DEFAULT 25000.00,
    ADD COLUMN overdue_payable_at_settlement BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN interest_calculation_method VARCHAR(50) NOT NULL DEFAULT 'REDUCING_BALANCE_DAILY_ACCRUAL';

UPDATE loan_penalty_policies
SET preclosure_enabled = TRUE,
    eligibility_period_months = 3,
    eligibility_start_basis = 'COMMENCEMENT_DATE',
    inclusive_end_date_rule = TRUE,
    fee_calculation_base = 'OUTSTANDING_PRINCIPAL',
    min_foreclosure_fee = 0.00,
    max_foreclosure_fee = 25000.00,
    overdue_payable_at_settlement = TRUE,
    interest_calculation_method = 'REDUCING_BALANCE_DAILY_ACCRUAL'
WHERE policy_code = 'IN_HOUSE_STD_2026';
