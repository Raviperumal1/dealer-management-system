-- V5__comprehensive_loan_ledger_and_foreclosure.sql
-- DEALEROS Comprehensive Loan Ledger, Transaction Audit, and Foreclosure Engine

CREATE TABLE IF NOT EXISTS loan_ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    finance_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    sale_id BIGINT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    entry_direction VARCHAR(10) NOT NULL, -- 'DEBIT' (increases balance) or 'CREDIT' (decreases balance)
    amount DECIMAL(14,2) NOT NULL,
    principal_portion DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    interest_portion DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    fee_portion DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    penalty_portion DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    principal_balance_after DECIMAL(14,2) NOT NULL,
    effective_date DATE NOT NULL,
    posting_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_reference VARCHAR(100) NULL,
    payment_method VARCHAR(50) NULL,
    payment_reference VARCHAR(100) NULL,
    idempotency_key VARCHAR(100) NULL,
    reversal_reference VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
    created_by_user VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    notes TEXT NULL,
    CONSTRAINT fk_lle_finance FOREIGN KEY (finance_id) REFERENCES finance_details (id),
    CONSTRAINT fk_lle_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    INDEX idx_lle_finance (finance_id),
    INDEX idx_lle_customer (customer_id),
    INDEX idx_lle_tx_type (transaction_type),
    INDEX idx_lle_date (effective_date),
    INDEX idx_lle_idempotency (idempotency_key)
);

CREATE TABLE IF NOT EXISTS loan_penalty_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    policy_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    borrower_category VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, COMMERCIAL
    interest_rate_type VARCHAR(30) NOT NULL DEFAULT 'FIXED', -- FIXED, FLOATING
    grace_period_days INT NOT NULL DEFAULT 3,
    charge_type VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE_OVERDUE', -- PERCENTAGE_OVERDUE, FIXED, NONE
    annual_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 24.00, -- e.g. 24% p.a. on overdue EMI amount (2% monthly)
    fixed_charge_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    per_event_cap DECIMAL(14,2) NOT NULL DEFAULT 5000.00,
    min_charge DECIMAL(14,2) NOT NULL DEFAULT 100.00,
    foreclosure_charge_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00, -- 0.00 for individual floating rate loans under RBI regulations
    rbi_floating_rate_foreclosure_exempt BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    disclosure_text TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Standard Indian Automotive Loan Penalty & Prepayment Policies compliant with RBI Directions
INSERT INTO loan_penalty_policies (
    policy_code, name, policy_version, borrower_category, interest_rate_type,
    grace_period_days, charge_type, annual_rate_percentage, fixed_charge_amount,
    per_event_cap, min_charge, foreclosure_charge_rate, rbi_floating_rate_foreclosure_exempt,
    is_active, disclosure_text
) VALUES
('IN_HOUSE_STD_2026', 'DEALEROS In-House Fixed Rate Policy', '1.0', 'INDIVIDUAL', 'FIXED',
 3, 'PERCENTAGE_OVERDUE', 24.00, 0.00, 5000.00, 100.00, 2.00, FALSE, TRUE,
 'Penal charge for overdue EMI calculated at 2% monthly on overdue instalment principal and interest after 3-day grace period. Contractual foreclosure charge 2% on principal outstanding.'),
('RBI_RETAIL_FLOAT_2026', 'RBI Retail Floating Rate Policy (Zero Foreclosure)', '1.0', 'INDIVIDUAL', 'FLOATING',
 3, 'PERCENTAGE_OVERDUE', 24.00, 0.00, 5000.00, 100.00, 0.00, TRUE, TRUE,
 'RBI Compliant: Nil prepayment and foreclosure charges for individual retail floating rate automotive loans. Overdue penal charge capped and non-capitalizing.'),
('COMMERCIAL_FLEET_2026', 'Commercial Vehicle Fleet Policy', '1.0', 'COMMERCIAL', 'FIXED',
 5, 'PERCENTAGE_OVERDUE', 24.00, 500.00, 10000.00, 250.00, 3.00, FALSE, TRUE,
 'Commercial vehicle financing terms. 5-day grace period, ₹500 bounce charge, 3% prepayment fee.')
ON DUPLICATE KEY UPDATE name = name;
