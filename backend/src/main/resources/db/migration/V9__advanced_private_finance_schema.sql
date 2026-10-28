-- V9__advanced_private_finance_schema.sql
-- Advanced Private Finance, Loan Products, Versioned Policies, Versioned Schedules & Double-Entry Journals

-- 1. Loan Products Master
CREATE TABLE IF NOT EXISTS loan_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    product_type VARCHAR(50) NOT NULL DEFAULT 'USED_VEHICLE_LOAN', -- USED_VEHICLE_LOAN, NEW_VEHICLE_LOAN, PERSONAL_LOAN, BUSINESS_LOAN
    rate_type VARCHAR(30) NOT NULL DEFAULT 'REDUCING_BALANCE', -- REDUCING_BALANCE, FLAT, FLOATING
    min_amount DECIMAL(19,2) NOT NULL DEFAULT 10000.00,
    max_amount DECIMAL(19,2) NOT NULL DEFAULT 5000000.00,
    min_tenure_months INT NOT NULL DEFAULT 6,
    max_tenure_months INT NOT NULL DEFAULT 84,
    default_annual_interest_rate DECIMAL(8,6) NOT NULL DEFAULT 10.000000,
    min_foir_percentage DECIMAL(5,2) DEFAULT 60.00,
    max_ltv_percentage DECIMAL(5,2) DEFAULT 85.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lp_active (is_active)
);

-- 2. Versioned Policy Tables (Policies can evolve over time; loans lock into a specific policy version)
CREATE TABLE IF NOT EXISTS loan_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_code VARCHAR(50) NOT NULL,
    policy_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    borrower_type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, BUSINESS
    rate_type VARCHAR(30) NOT NULL DEFAULT 'REDUCING_BALANCE', -- REDUCING_BALANCE, FLAT, FLOATING
    processing_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    documentation_charges DECIMAL(19,2) NOT NULL DEFAULT 500.00,
    stamp_duty_charges DECIMAL(19,2) NOT NULL DEFAULT 200.00,
    bounce_charge DECIMAL(19,2) NOT NULL DEFAULT 500.00,
    penal_annual_rate_percentage DECIMAL(8,6) NOT NULL DEFAULT 24.000000,
    grace_period_days INT NOT NULL DEFAULT 3,
    foreclosure_charge_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    rbi_zero_foreclosure_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    min_months_for_foreclosure INT NOT NULL DEFAULT 3,
    waterfall_priority VARCHAR(255) NOT NULL DEFAULT 'TAX,PENALTY,FEE,OVERDUE_INTEREST,OVERDUE_PRINCIPAL,CURRENT_INTEREST,CURRENT_PRINCIPAL,ADVANCE',
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lp_code_ver UNIQUE (policy_code, policy_version),
    INDEX idx_lp_eff (effective_from, is_active)
);

-- 3. Core Loan Accounts (Formal contract account with optimistic lock & versioning)
CREATE TABLE IF NOT EXISTS loan_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_account_number VARCHAR(64) NOT NULL UNIQUE,
    finance_detail_id BIGINT NULL,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NULL,
    sale_id BIGINT NULL,
    product_id BIGINT NOT NULL,
    policy_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', 
    -- DRAFT, SUBMITTED, UNDER_REVIEW, SANCTIONED, AGREEMENT_PENDING, DISBURSEMENT_PENDING, ACTIVE, FORECLOSURE_IN_PROGRESS, CLOSED, REJECTED, CANCELLED, WRITTEN_OFF, SETTLED_OTS
    delinquency_bucket VARCHAR(30) NOT NULL DEFAULT 'CURRENT', -- CURRENT, SMA_0, SMA_1, SMA_2, NPA
    days_past_due INT NOT NULL DEFAULT 0,
    sanctioned_amount DECIMAL(19,2) NOT NULL,
    disbursed_amount DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    tenure_months INT NOT NULL,
    annual_interest_rate DECIMAL(8,6) NOT NULL,
    monthly_emi_amount DECIMAL(19,2) NOT NULL,
    principal_outstanding DECIMAL(19,2) NOT NULL,
    total_principal_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    total_interest_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    total_penalties_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    total_fees_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    excess_credit_balance DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    disbursement_date DATE NULL,
    commencement_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    closed_date DATE NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_by_user VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_la_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_la_product FOREIGN KEY (product_id) REFERENCES loan_products(id),
    CONSTRAINT fk_la_policy FOREIGN KEY (policy_id) REFERENCES loan_policies(id),
    INDEX idx_la_status (status),
    INDEX idx_la_dpd (delinquency_bucket, days_past_due)
);

-- 4. Versioned Repayment Schedules
CREATE TABLE IF NOT EXISTS loan_schedule_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_account_id BIGINT NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    reason VARCHAR(100) NOT NULL DEFAULT 'ORIGINAL_SANCTION', -- ORIGINAL_SANCTION, PART_PAYMENT, RESTRUCTURE, RATE_RESET
    effective_from_date DATE NOT NULL,
    total_installments INT NOT NULL,
    created_by_user VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lsv_loan FOREIGN KEY (loan_account_id) REFERENCES loan_accounts(id),
    CONSTRAINT uk_lsv_loan_ver UNIQUE (loan_account_id, version_number)
);

-- 5. Individual Scheduled Installments
CREATE TABLE IF NOT EXISTS loan_installments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_version_id BIGINT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    opening_principal DECIMAL(19,2) NOT NULL,
    principal_amount DECIMAL(19,2) NOT NULL,
    interest_amount DECIMAL(19,2) NOT NULL,
    emi_amount DECIMAL(19,2) NOT NULL,
    closing_principal DECIMAL(19,2) NOT NULL,
    principal_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    interest_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    penalty_accrued DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    penalty_paid DECIMAL(19,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PARTIALLY_PAID, PAID, OVERDUE, WAIVED
    paid_date DATE NULL,
    CONSTRAINT fk_li_version FOREIGN KEY (schedule_version_id) REFERENCES loan_schedule_versions(id),
    INDEX idx_li_due (due_date, status)
);

-- 6. Append-Only Financial Journal Entries (Double-Entry Subledger)
CREATE TABLE IF NOT EXISTS loan_ledger_journals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_id VARCHAR(64) NOT NULL UNIQUE,
    loan_account_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    posting_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL, -- DISBURSEMENT, INTEREST_ACCRUAL, EMI_RECEIPT, PART_PAYMENT, FORECLOSURE, WAIVER, REVERSAL
    debit_account VARCHAR(100) NOT NULL,
    credit_account VARCHAR(100) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    idempotency_key VARCHAR(100) NULL,
    source_reference VARCHAR(100) NULL,
    created_by_user VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    notes TEXT NULL,
    CONSTRAINT fk_llj_loan FOREIGN KEY (loan_account_id) REFERENCES loan_accounts(id),
    INDEX idx_llj_loan (loan_account_id),
    INDEX idx_llj_date (transaction_date),
    INDEX idx_llj_idemp (idempotency_key)
);

-- 7. Seed Initial Master Products and Policies
INSERT IGNORE INTO loan_products (
    product_code, name, product_type, rate_type, min_amount, max_amount,
    min_tenure_months, max_tenure_months, default_annual_interest_rate, is_active
) VALUES 
('USED_CAR_REDUCING', 'Used Vehicle Reducing Loan', 'USED_VEHICLE_LOAN', 'REDUCING_BALANCE', 50000.00, 2000000.00, 12, 60, 10.000000, TRUE),
('USED_BIKE_REDUCING', 'Used Two-Wheeler Loan', 'USED_VEHICLE_LOAN', 'REDUCING_BALANCE', 15000.00, 200000.00, 6, 36, 12.500000, TRUE);

INSERT IGNORE INTO loan_policies (
    policy_code, policy_version, borrower_type, rate_type, processing_fee_percentage,
    documentation_charges, stamp_duty_charges, bounce_charge, penal_annual_rate_percentage,
    grace_period_days, foreclosure_charge_percentage, rbi_zero_foreclosure_exempt,
    min_months_for_foreclosure, waterfall_priority, effective_from, is_active
) VALUES 
('POL_FIXED_IND_2026', '1.0', 'INDIVIDUAL', 'REDUCING_BALANCE', 1.00, 500.00, 200.00, 500.00, 24.000000, 3, 2.00, FALSE, 3, 'TAX,PENALTY,FEE,OVERDUE_INTEREST,OVERDUE_PRINCIPAL,CURRENT_INTEREST,CURRENT_PRINCIPAL,ADVANCE', '2026-01-01', TRUE),
('POL_FLOAT_IND_2026', '1.0', 'INDIVIDUAL', 'FLOATING', 1.00, 500.00, 200.00, 500.00, 24.000000, 3, 0.00, TRUE, 0, 'TAX,PENALTY,FEE,OVERDUE_INTEREST,OVERDUE_PRINCIPAL,CURRENT_INTEREST,CURRENT_PRINCIPAL,ADVANCE', '2026-01-01', TRUE);
