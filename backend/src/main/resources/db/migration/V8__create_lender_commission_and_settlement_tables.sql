-- V8__create_lender_commission_and_settlement_tables.sql
-- Comprehensive Lender Commission, Invoicing, Receipts and Settlements Schema

CREATE TABLE IF NOT EXISTS lender_commissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    commission_reference VARCHAR(64) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    lender_id BIGINT NOT NULL,
    lender_name VARCHAR(150) NOT NULL,
    agreement_reference VARCHAR(100),
    policy_version VARCHAR(20) DEFAULT '1.0',
    
    -- Linked Source Records
    loan_application_id BIGINT NULL,
    loan_application_number VARCHAR(50) NULL,
    finance_detail_id BIGINT NULL,
    loan_account_number VARCHAR(64) NULL,
    sale_id BIGINT NULL,
    sale_number VARCHAR(50) NULL,
    customer_id BIGINT NULL,
    customer_name VARCHAR(150) NULL,
    vehicle_id BIGINT NULL,
    vehicle_reg_number VARCHAR(50) NULL,
    vehicle_description VARCHAR(150) NULL,
    
    -- Transaction & Base Amounts
    disbursement_date DATE NULL,
    actual_disbursed_amount DECIMAL(14,2) DEFAULT 0.00,
    processing_fee_collected DECIMAL(14,2) DEFAULT 0.00,
    
    -- Calculation Methodology
    calculation_method VARCHAR(50) NOT NULL, -- PERCENTAGE_OF_DISBURSEMENT, PERCENTAGE_OF_PROCESSING_FEE, FIXED_AMOUNT, TIERED_VOLUME
    commission_base_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    commission_rate_percentage DECIMAL(5,2) DEFAULT 0.00,
    fixed_commission_rate DECIMAL(14,2) DEFAULT 0.00,
    
    -- Computed Financial Components
    gross_commission DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 18.00, -- GST on DSA / Lending Services
    tax_amount DECIMAL(14,2) DEFAULT 0.00,
    tds_percentage DECIMAL(5,2) DEFAULT 5.00, -- Section 194H TDS on Commission
    tds_withheld DECIMAL(14,2) DEFAULT 0.00,
    approved_adjustments DECIMAL(14,2) DEFAULT 0.00,
    net_receivable DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    
    -- Invoicing & Realization Tracking
    amount_invoiced DECIMAL(14,2) DEFAULT 0.00,
    amount_received DECIMAL(14,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    invoice_number VARCHAR(100) NULL,
    invoice_date DATE NULL,
    payment_receipt_reference VARCHAR(100) NULL,
    bank_utr_reference VARCHAR(100) NULL,
    settlement_reference VARCHAR(100) NULL,
    
    -- Commission Lifecycle Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACCRUED', -- PENDING_ELIGIBILITY, ACCRUED, APPROVAL_PENDING, APPROVED, INVOICED, PARTIALLY_SETTLED, SETTLED, REJECTED, REVERSED
    entry_mode VARCHAR(20) NOT NULL DEFAULT 'LOAN_LINKED', -- LOAN_LINKED, MANUAL
    manual_entry_reason TEXT NULL,
    
    -- Approvals & Audit
    approved_by VARCHAR(100) NULL,
    approval_timestamp TIMESTAMP NULL,
    approval_remarks TEXT NULL,
    notes TEXT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    
    INDEX idx_lc_lender (lender_id),
    INDEX idx_lc_status (status),
    INDEX idx_lc_loan_app (loan_application_id),
    INDEX idx_lc_sale (sale_id),
    INDEX idx_lc_entry_date (entry_date),
    INDEX idx_lc_reference (commission_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lender_commission_receipts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_reference VARCHAR(64) NOT NULL UNIQUE,
    lender_id BIGINT NOT NULL,
    lender_name VARCHAR(150) NOT NULL,
    receipt_date DATE NOT NULL,
    total_received_amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    bank_utr_reference VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NULL,
    allocated_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    unallocated_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tds_deducted_by_bank DECIMAL(14,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED', -- PENDING_VERIFICATION, VERIFIED, REVERSED
    reconciliation_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    
    INDEX idx_lcr_lender (lender_id),
    INDEX idx_lcr_date (receipt_date),
    INDEX idx_lcr_utr (bank_utr_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lender_commission_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    commission_id BIGINT NOT NULL,
    allocated_amount DECIMAL(14,2) NOT NULL,
    tds_allocated DECIMAL(14,2) DEFAULT 0.00,
    allocation_date DATE NOT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_lca_receipt FOREIGN KEY (receipt_id) REFERENCES lender_commission_receipts (id) ON DELETE CASCADE,
    CONSTRAINT fk_lca_commission FOREIGN KEY (commission_id) REFERENCES lender_commissions (id) ON DELETE CASCADE,
    INDEX idx_lca_receipt (receipt_id),
    INDEX idx_lca_commission (commission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
