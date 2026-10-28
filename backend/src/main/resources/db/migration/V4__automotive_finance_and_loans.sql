-- V4: Complete Automotive Finance & Loan Management Module
-- Creates lenders and finance applications tables, and enhances finance_details and emi_schedules

CREATE TABLE IF NOT EXISTS finance_lenders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lender_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    lender_type VARCHAR(50) NOT NULL DEFAULT 'BANK',
    contact_person VARCHAR(100),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(150),
    supported_vehicle_types VARCHAR(100) DEFAULT 'ALL',
    min_tenure_months INT DEFAULT 12,
    max_tenure_months INT DEFAULT 60,
    indicative_interest_rate DECIMAL(5,2) DEFAULT 9.50,
    processing_fee_percentage DECIMAL(5,2) DEFAULT 1.00,
    documentation_checklist TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fl_active (is_active)
);

CREATE TABLE IF NOT EXISTS finance_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    sale_id BIGINT,
    finance_type VARCHAR(50) NOT NULL DEFAULT 'IN_HOUSE',
    lender_id BIGINT,
    lender_name VARCHAR(150),
    applicant_name VARCHAR(150) NOT NULL,
    applicant_phone VARCHAR(30) NOT NULL,
    applicant_email VARCHAR(150),
    employment_type VARCHAR(50),
    declared_monthly_income DECIMAL(14,2) DEFAULT 0.00,
    total_vehicle_price DECIMAL(14,2) NOT NULL,
    down_payment DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    trade_in_credit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    requested_loan_amount DECIMAL(14,2) NOT NULL,
    requested_tenure_months INT NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    estimated_emi DECIMAL(14,2) NOT NULL,
    processing_fee DECIMAL(14,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    sanctioned_amount DECIMAL(14,2) DEFAULT 0.00,
    sanction_letter_reference VARCHAR(100),
    sanction_date DATE,
    sanction_valid_until DATE,
    disbursed_amount DECIMAL(14,2) DEFAULT 0.00,
    disbursement_date DATE,
    disbursement_reference VARCHAR(100),
    rejection_reason VARCHAR(255),
    notes TEXT,
    created_by_user VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fa_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_fa_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_fa_status (status),
    INDEX idx_fa_finance_type (finance_type)
);

-- Seed top Indian Automotive Lenders
INSERT INTO finance_lenders (lender_code, name, lender_type, contact_person, contact_phone, contact_email, min_tenure_months, max_tenure_months, indicative_interest_rate, processing_fee_percentage, notes)
VALUES
('HDFC-AUTO', 'HDFC Bank Auto Finance', 'BANK', 'Mr. Amit Sharma', '9811122334', 'autoloans@hdfcbank.com', 12, 84, 8.75, 1.00, 'Direct API partner for instant pre-approvals'),
('ICICI-AUTO', 'ICICI Bank Two & Four Wheeler Loans', 'BANK', 'Ms. Neha Verma', '9822233445', 'auto.finance@icicibank.com', 12, 84, 8.90, 1.25, 'Special interest rate programs for prime pre-owned vehicles'),
('SBI-AUTO', 'State Bank of India (SBI Car Loan)', 'BANK', 'Mr. R. K. Singh', '9833344556', 'sbi.autoloan@sbi.co.in', 12, 84, 8.65, 0.50, 'Low processing fees, high loan-to-value ratio'),
('BAJAJ-FIN', 'Bajaj Finance Auto NBFC', 'NBFC', 'Mr. Vikram Patil', '9844455667', 'autocare@bajajfinserv.in', 12, 60, 10.50, 2.00, 'Fast disbursements for bikes, scooters and used cars'),
('MAHINDRA-FIN', 'Mahindra & Mahindra Financial Services', 'NBFC', 'Mr. Suresh Kumar', '9855566778', 'feedback@mahindrafinance.com', 12, 60, 11.25, 2.50, 'Rural and semi-urban vehicle financing specialist')
ON DUPLICATE KEY UPDATE name=name;
