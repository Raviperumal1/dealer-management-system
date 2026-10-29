-- V3__enhance_inventory_and_purchasing.sql
-- Recovery version for the currently confirmed Aiven schema state.
-- IMPORTANT: Back up the database before deploying. This migration uses regular
-- MySQL DDL (no stored procedures or DELIMITER commands).
--
-- Preconditions confirmed from the current investigation:
--   * suppliers.supplier_code already exists and contains SUP-0001 / SUP-0002.
--   * uk_suppliers_supplier_code already exists.
--   * The listed V3 enhancement columns are absent.
--   * supplier_payments, supplier_ledger_entries, market_comparables are absent.
--
-- If these preconditions change before deployment, inspect the schema first.
-- MySQL DDL can implicitly commit, so a failure can leave partial changes.

-- Keep existing supplier codes. This only fills missing codes if any exist.
UPDATE suppliers
SET supplier_code = CONCAT('SUP-', LPAD(id, 4, '0'))
WHERE supplier_code IS NULL AND id > 0;

-- Supplier codes and the unique index were verified separately before this migration.
-- Do not add supplier_code or recreate uk_suppliers_supplier_code here.

-- 1. Spare-parts inventory enhancements.
ALTER TABLE parts
    ADD COLUMN manufacturer_brand VARCHAR(100) NULL AFTER category,
    ADD COLUMN part_number VARCHAR(100) NULL AFTER manufacturer_brand,
    ADD COLUMN compatible_vehicle_type VARCHAR(30) NOT NULL DEFAULT 'FOUR_WHEELER' AFTER part_number,
    ADD COLUMN compatible_models VARCHAR(255) NULL AFTER compatible_vehicle_type,
    ADD COLUMN preferred_supplier_id BIGINT NULL AFTER unit,
    ADD COLUMN alternate_suppliers VARCHAR(255) NULL AFTER preferred_supplier_id,
    ADD COLUMN landed_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER purchase_price,
    ADD COLUMN reserved_stock INT NOT NULL DEFAULT 0 AFTER current_stock,
    ADD COLUMN reorder_level INT NOT NULL DEFAULT 5 AFTER reserved_stock,
    ADD COLUMN storage_location VARCHAR(100) NULL AFTER low_stock_threshold,
    ADD COLUMN batch_or_serial_number VARCHAR(100) NULL AFTER storage_location,
    ADD COLUMN warranty_info VARCHAR(255) NULL AFTER batch_or_serial_number;

ALTER TABLE parts
    ADD CONSTRAINT fk_parts_pref_supplier
        FOREIGN KEY (preferred_supplier_id)
        REFERENCES suppliers(id)
        ON DELETE SET NULL;

-- 2. Purchase-invoice enhancements.
ALTER TABLE purchase_invoices
    ADD COLUMN supplier_invoice_number VARCHAR(100) NULL AFTER invoice_number,
    ADD COLUMN purchase_date DATE NULL AFTER invoice_date,
    ADD COLUMN expected_delivery_date DATE NULL AFTER purchase_date,
    ADD COLUMN due_date DATE NULL AFTER expected_delivery_date,
    ADD COLUMN branch_warehouse VARCHAR(100) NULL AFTER due_date,
    ADD COLUMN vehicle_id BIGINT NULL AFTER branch_warehouse,
    ADD COLUMN job_card_id BIGINT NULL AFTER vehicle_id,
    ADD COLUMN subtotal_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER job_card_id,
    ADD COLUMN discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER subtotal_amount,
    ADD COLUMN freight_charge DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER tax_amount,
    ADD COLUMN other_charges DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER freight_charge,
    ADD COLUMN amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER total_amount,
    ADD COLUMN amount_outstanding DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER amount_paid,
    ADD COLUMN created_by_user VARCHAR(100) NULL AFTER posted_at;

ALTER TABLE purchase_invoices
    ADD CONSTRAINT fk_pi_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_pi_jobcard
        FOREIGN KEY (job_card_id)
        REFERENCES job_cards(id)
        ON DELETE SET NULL;

-- 3. Purchase-invoice item enhancements.
ALTER TABLE purchase_invoice_items
    ADD COLUMN line_discount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER unit_price,
    ADD COLUMN tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER tax_percentage,
    ADD COLUMN landed_cost_allocation DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER tax_amount;

-- 4. Supplier payments.
CREATE TABLE supplier_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    invoice_id BIGINT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    transaction_reference VARCHAR(100) NULL,
    is_advance BOOLEAN NOT NULL DEFAULT FALSE,
    unallocated_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    branch_warehouse VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_by_user VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sp_invoice