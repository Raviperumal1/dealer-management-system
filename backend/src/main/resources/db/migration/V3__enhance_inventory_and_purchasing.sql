-- V3__enhance_inventory_and_purchasing.sql
-- Enterprise enhancement for Suppliers, Spare Parts Inventory, Supplier Payments, Ledger, and Market Pricing

-- 1. Alter suppliers table with enterprise fields
ALTER TABLE suppliers
    ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50) UNIQUE AFTER id,
    ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(50) DEFAULT 'SPARE_PARTS' AFTER name,
    ADD COLUMN IF NOT EXISTS alternate_contact VARCHAR(30) AFTER mobile,
    ADD COLUMN IF NOT EXISTS pan_number VARCHAR(30) AFTER gst_number,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER address,
    ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER city,
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) AFTER state,
    ADD COLUMN IF NOT EXISTS bank_details TEXT AFTER pincode,
    ADD COLUMN IF NOT EXISTS opening_outstanding_balance DECIMAL(14,2) DEFAULT 0.00 AFTER bank_details,
    ADD COLUMN IF NOT EXISTS opening_advance_balance DECIMAL(14,2) DEFAULT 0.00 AFTER opening_outstanding_balance,
    ADD COLUMN IF NOT EXISTS credit_enabled BOOLEAN DEFAULT TRUE AFTER opening_advance_balance,
    ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(14,2) DEFAULT 0.00 AFTER credit_enabled,
    ADD COLUMN IF NOT EXISTS credit_period_days INT DEFAULT 30 AFTER credit_limit,
    ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'CREDIT' AFTER credit_period_days,
    ADD COLUMN IF NOT EXISTS notes TEXT AFTER payment_terms;

-- 2. Alter parts table with manufacturer, vehicle compatibility, and storage fields
ALTER TABLE parts
    ADD COLUMN IF NOT EXISTS manufacturer_brand VARCHAR(100) AFTER category,
    ADD COLUMN IF NOT EXISTS part_number VARCHAR(100) AFTER manufacturer_brand,
    ADD COLUMN IF NOT EXISTS compatible_vehicle_type VARCHAR(30) DEFAULT 'FOUR_WHEELER' AFTER part_number,
    ADD COLUMN IF NOT EXISTS compatible_models VARCHAR(255) AFTER compatible_vehicle_type,
    ADD COLUMN IF NOT EXISTS preferred_supplier_id BIGINT AFTER unit,
    ADD COLUMN IF NOT EXISTS alternate_suppliers VARCHAR(255) AFTER preferred_supplier_id,
    ADD COLUMN IF NOT EXISTS landed_cost DECIMAL(14,2) DEFAULT 0.00 AFTER purchase_price,
    ADD COLUMN IF NOT EXISTS reserved_stock INT DEFAULT 0 AFTER current_stock,
    ADD COLUMN IF NOT EXISTS reorder_level INT DEFAULT 5 AFTER reserved_stock,
    ADD COLUMN IF NOT EXISTS storage_location VARCHAR(100) AFTER low_stock_threshold,
    ADD COLUMN IF NOT EXISTS batch_or_serial_number VARCHAR(100) AFTER storage_location,
    ADD COLUMN IF NOT EXISTS warranty_info VARCHAR(255) AFTER batch_or_serial_number;

-- Add index and foreign key for parts preferred supplier
ALTER TABLE parts
    ADD CONSTRAINT fk_parts_pref_supplier FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- 3. Alter purchase_invoices table
ALTER TABLE purchase_invoices
    ADD COLUMN IF NOT EXISTS supplier_invoice_number VARCHAR(100) AFTER invoice_number,
    ADD COLUMN IF NOT EXISTS purchase_date DATE AFTER invoice_date,
    ADD COLUMN IF NOT EXISTS expected_delivery_date DATE AFTER purchase_date,
    ADD COLUMN IF NOT EXISTS due_date DATE AFTER expected_delivery_date,
    ADD COLUMN IF NOT EXISTS branch_warehouse VARCHAR(100) AFTER due_date,
    ADD COLUMN IF NOT EXISTS vehicle_id BIGINT AFTER branch_warehouse,
    ADD COLUMN IF NOT EXISTS job_card_id BIGINT AFTER vehicle_id,
    ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(14,2) DEFAULT 0.00 AFTER job_card_id,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(14,2) DEFAULT 0.00 AFTER subtotal_amount,
    ADD COLUMN IF NOT EXISTS freight_charge DECIMAL(14,2) DEFAULT 0.00 AFTER tax_amount,
    ADD COLUMN IF NOT EXISTS other_charges DECIMAL(14,2) DEFAULT 0.00 AFTER freight_charge,
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(14,2) DEFAULT 0.00 AFTER total_amount,
    ADD COLUMN IF NOT EXISTS amount_outstanding DECIMAL(14,2) DEFAULT 0.00 AFTER amount_paid,
    ADD COLUMN IF NOT EXISTS created_by_user VARCHAR(100) AFTER posted_at;

ALTER TABLE purchase_invoices
    ADD CONSTRAINT fk_pi_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_pi_jobcard FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL;

-- 4. Alter purchase_invoice_items
ALTER TABLE purchase_invoice_items
    ADD COLUMN IF NOT EXISTS line_discount DECIMAL(14,2) DEFAULT 0.00 AFTER unit_price,
    ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(14,2) DEFAULT 0.00 AFTER tax_percentage,
    ADD COLUMN IF NOT EXISTS landed_cost_allocation DECIMAL(14,2) DEFAULT 0.00 AFTER tax_amount;

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
