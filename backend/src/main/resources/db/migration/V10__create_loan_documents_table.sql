-- V10__create_loan_documents_table.sql
-- Centralized Loan & Financial Documents, NOC, Receipts and Agreements Registry

CREATE TABLE IF NOT EXISTS loan_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_reference VARCHAR(64) NOT NULL UNIQUE,
    finance_id BIGINT NULL,
    customer_id BIGINT NULL,
    vehicle_id BIGINT NULL,
    category VARCHAR(50) NOT NULL, -- CUSTOMER, VEHICLE, LOAN, PAYMENT, CLOSURE, NOC
    document_type VARCHAR(50) NOT NULL, -- NOC_CERTIFICATE, REPAYMENT_SCHEDULE, PAYMENT_RECEIPT, SANCTION_LETTER, LOAN_AGREEMENT, ID_PROOF, RC_COPY, OTHER
    title VARCHAR(200) NOT NULL,
    file_key VARCHAR(150) NOT NULL,
    original_filename VARCHAR(255) NULL,
    file_size BIGINT NULL,
    content_type VARCHAR(100) NULL,
    issue_date DATE NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED', -- PENDING, VERIFIED, REJECTED, SUPERSEDED
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    CONSTRAINT fk_ldoc_finance FOREIGN KEY (finance_id) REFERENCES finance_details(id),
    CONSTRAINT fk_ldoc_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_ldoc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_ldoc_finance (finance_id),
    INDEX idx_ldoc_customer (customer_id),
    INDEX idx_ldoc_vehicle (vehicle_id),
    INDEX idx_ldoc_category (category),
    INDEX idx_ldoc_type (document_type)
);
