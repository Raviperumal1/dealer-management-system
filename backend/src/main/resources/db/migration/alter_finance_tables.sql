-- V4.1: Alter existing tables for comprehensive finance
ALTER TABLE finance_details
    ADD COLUMN finance_type VARCHAR(50) NOT NULL DEFAULT 'IN_HOUSE',
    ADD COLUMN lender_id BIGINT NULL,
    ADD COLUMN finance_application_id BIGINT NULL,
    ADD COLUMN processing_fee DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN principal_outstanding DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN total_interest_accrued DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN total_interest_paid DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN total_principal_paid DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN foreclosure_charge DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN closed_date DATE NULL,
    ADD COLUMN closure_remarks VARCHAR(255) NULL;

ALTER TABLE emi_schedules
    ADD COLUMN principal_remaining DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN payment_reference VARCHAR(100) NULL,
    ADD COLUMN payment_method VARCHAR(50) NULL,
    ADD COLUMN penalty_amount DECIMAL(14,2) DEFAULT 0.00;

ALTER TABLE sales
    ADD COLUMN customer_contribution DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN lender_disbursement DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN trade_in_allowance DECIMAL(14,2) DEFAULT 0.00;
