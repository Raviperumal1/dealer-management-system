-- V3__enhance_inventory_and_purchasing.sql
-- Enterprise enhancement for Suppliers, Spare Parts Inventory, Supplier Payments, Ledger, and Market Pricing

-- 1. Alter suppliers table with enterprise fields
-- (Note: supplier_code is managed with NOT EXISTS check in case it already exists)
DROP PROCEDURE IF EXISTS upgrade_v3_schema;

DELIMITER $$
CREATE PROCEDURE upgrade_v3_schema()
BEGIN
    -- Suppliers columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'supplier_code') THEN
        ALTER TABLE suppliers ADD COLUMN supplier_code VARCHAR(50) UNIQUE AFTER id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'supplier_type') THEN
        ALTER TABLE suppliers ADD COLUMN supplier_type VARCHAR(50) DEFAULT 'SPARE_PARTS' AFTER name;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'alternate_contact') THEN
        ALTER TABLE suppliers ADD COLUMN alternate_contact VARCHAR(30) AFTER mobile;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'pan_number') THEN
        ALTER TABLE suppliers ADD COLUMN pan_number VARCHAR(30) AFTER gst_number;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'city') THEN
        ALTER TABLE suppliers ADD COLUMN city VARCHAR(100) AFTER address;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'state') THEN
        ALTER TABLE suppliers ADD COLUMN state VARCHAR(100) AFTER city;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'pincode') THEN
        ALTER TABLE suppliers ADD COLUMN pincode VARCHAR(20) AFTER state;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'bank_details') THEN
        ALTER TABLE suppliers ADD COLUMN bank_details TEXT AFTER pincode;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'opening_outstanding_balance') THEN
        ALTER TABLE suppliers ADD COLUMN opening_outstanding_balance DECIMAL(14,2) DEFAULT 0.00 AFTER bank_details;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'opening_advance_balance') THEN
        ALTER TABLE suppliers ADD COLUMN opening_advance_balance DECIMAL(14,2) DEFAULT 0.00 AFTER opening_outstanding_balance;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'credit_enabled') THEN
        ALTER TABLE suppliers ADD COLUMN credit_enabled BOOLEAN DEFAULT TRUE AFTER opening_advance_balance;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'credit_limit') THEN
        ALTER TABLE suppliers ADD COLUMN credit_limit DECIMAL(14,2) DEFAULT 0.00 AFTER credit_enabled;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'credit_period_days') THEN
        ALTER TABLE suppliers ADD COLUMN credit_period_days INT DEFAULT 30 AFTER credit_limit;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'payment_terms') THEN
        ALTER TABLE suppliers ADD COLUMN payment_terms VARCHAR(50) DEFAULT 'CREDIT' AFTER credit_period_days;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'notes') THEN
        ALTER TABLE suppliers ADD COLUMN notes TEXT AFTER payment_terms;
    END IF;

    -- Parts columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'manufacturer_brand') THEN
        ALTER TABLE parts ADD COLUMN manufacturer_brand VARCHAR(100) AFTER category;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'part_number') THEN
        ALTER TABLE parts ADD COLUMN part_number VARCHAR(100) AFTER manufacturer_brand;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'compatible_vehicle_type') THEN
        ALTER TABLE parts ADD COLUMN compatible_vehicle_type VARCHAR(30) DEFAULT 'FOUR_WHEELER' AFTER part_number;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'compatible_models') THEN
        ALTER TABLE parts ADD COLUMN compatible_models VARCHAR(255) AFTER compatible_vehicle_type;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'preferred_supplier_id') THEN
        ALTER TABLE parts ADD COLUMN preferred_supplier_id BIGINT AFTER unit;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'alternate_suppliers') THEN
        ALTER TABLE parts ADD COLUMN alternate_suppliers VARCHAR(255) AFTER preferred_supplier_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'landed_cost') THEN
        ALTER TABLE parts ADD COLUMN landed_cost DECIMAL(14,2) DEFAULT 0.00 AFTER purchase_price;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'reserved_stock') THEN
        ALTER TABLE parts ADD COLUMN reserved_stock INT DEFAULT 0 AFTER current_stock;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'reorder_level') THEN
        ALTER TABLE parts ADD COLUMN reorder_level INT DEFAULT 5 AFTER reserved_stock;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'storage_location') THEN
        ALTER TABLE parts ADD COLUMN storage_location VARCHAR(100) AFTER low_stock_threshold;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'batch_or_serial_number') THEN
        ALTER TABLE parts ADD COLUMN batch_or_serial_number VARCHAR(100) AFTER storage_location;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND COLUMN_NAME = 'warranty_info') THEN
        ALTER TABLE parts ADD COLUMN warranty_info VARCHAR(255) AFTER batch_or_serial_number;
    END IF;

    -- Parts constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'parts' AND CONSTRAINT_NAME = 'fk_parts_pref_supplier') THEN
        ALTER TABLE parts ADD CONSTRAINT fk_parts_pref_supplier FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;

    -- Purchase Invoices columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'supplier_invoice_number') THEN
        ALTER TABLE purchase_invoices ADD COLUMN supplier_invoice_number VARCHAR(100) AFTER invoice_number;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'purchase_date') THEN
        ALTER TABLE purchase_invoices ADD COLUMN purchase_date DATE AFTER invoice_date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'expected_delivery_date') THEN
        ALTER TABLE purchase_invoices ADD COLUMN expected_delivery_date DATE AFTER purchase_date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'due_date') THEN
        ALTER TABLE purchase_invoices ADD COLUMN due_date DATE AFTER expected_delivery_date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'branch_warehouse') THEN
        ALTER TABLE purchase_invoices ADD COLUMN branch_warehouse VARCHAR(100) AFTER due_date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'vehicle_id') THEN
        ALTER TABLE purchase_invoices ADD COLUMN vehicle_id BIGINT AFTER branch_warehouse;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'job_card_id') THEN
        ALTER TABLE purchase_invoices ADD COLUMN job_card_id BIGINT AFTER vehicle_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'subtotal_amount') THEN
        ALTER TABLE purchase_invoices ADD COLUMN subtotal_amount DECIMAL(14,2) DEFAULT 0.00 AFTER job_card_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'discount_amount') THEN
        ALTER TABLE purchase_invoices ADD COLUMN discount_amount DECIMAL(14,2) DEFAULT 0.00 AFTER subtotal_amount;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'freight_charge') THEN
        ALTER TABLE purchase_invoices ADD COLUMN freight_charge DECIMAL(14,2) DEFAULT 0.00 AFTER tax_amount;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'other_charges') THEN
        ALTER TABLE purchase_invoices ADD COLUMN other_charges DECIMAL(14,2) DEFAULT 0.00 AFTER freight_charge;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'amount_paid') THEN
        ALTER TABLE purchase_invoices ADD COLUMN amount_paid DECIMAL(14,2) DEFAULT 0.00 AFTER total_amount;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'amount_outstanding') THEN
        ALTER TABLE purchase_invoices ADD COLUMN amount_outstanding DECIMAL(14,2) DEFAULT 0.00 AFTER amount_paid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND COLUMN_NAME = 'created_by_user') THEN
        ALTER TABLE purchase_invoices ADD COLUMN created_by_user VARCHAR(100) AFTER posted_at;
    END IF;

    -- Purchase Invoices constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND CONSTRAINT_NAME = 'fk_pi_vehicle') THEN
        ALTER TABLE purchase_invoices ADD CONSTRAINT fk_pi_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoices' AND CONSTRAINT_NAME = 'fk_pi_jobcard') THEN
        ALTER TABLE purchase_invoices ADD CONSTRAINT fk_pi_jobcard FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL;
    END IF;

    -- Purchase Invoice Items columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoice_items' AND COLUMN_NAME = 'line_discount') THEN
        ALTER TABLE purchase_invoice_items ADD COLUMN line_discount DECIMAL(14,2) DEFAULT 0.00 AFTER unit_price;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoice_items' AND COLUMN_NAME = 'tax_amount') THEN
        ALTER TABLE purchase_invoice_items ADD COLUMN tax_amount DECIMAL(14,2) DEFAULT 0.00 AFTER tax_percentage;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_invoice_items' AND COLUMN_NAME = 'landed_cost_allocation') THEN
        ALTER TABLE purchase_invoice_items ADD COLUMN landed_cost_allocation DECIMAL(14,2) DEFAULT 0.00 AFTER tax_amount;
    END IF;
END$$
DELIMITER ;

CALL upgrade_v3_schema();
DROP PROCEDURE IF EXISTS upgrade_v3_schema;

-- 5. Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    invoice_id BIGINT,
    payment_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    transaction_reference VARCHAR(100),
    is_advance BOOLEAN NOT NULL DEFAULT FALSE,
    unallocated_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    branch_warehouse VARCHAR(100),
    notes VARCHAR(255),
    created_by_user VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sp_invoice FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL,
    INDEX idx_sp_supplier_date (supplier_id, payment_date)
);

-- 6. Create supplier_ledger_entries table
CREATE TABLE IF NOT EXISTS supplier_ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    description VARCHAR(255),
    debit_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    credit_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    running_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    created_by_user VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sle_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_sle_supplier_date (supplier_id, entry_date)
);

-- 7. Create market_comparables table
CREATE TABLE IF NOT EXISTS market_comparables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(100),
    manufacturing_year INT,
    registration_year INT,
    fuel_type VARCHAR(30),
    transmission VARCHAR(30),
    odometer_reading INT,
    vehicle_condition VARCHAR(50),
    location VARCHAR(100),
    asking_price DECIMAL(14,2) NOT NULL,
    listing_source VARCHAR(100),
    listing_url VARCHAR(255),
    observation_date DATE NOT NULL,
    notes TEXT,
    created_by_user VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_mc_make_model (make, model)
);

-- 8. Backfill supplier codes for existing baseline suppliers
UPDATE suppliers SET supplier_code = CONCAT('SUP-', LPAD(id, 4, '0')) WHERE supplier_code IS NULL;