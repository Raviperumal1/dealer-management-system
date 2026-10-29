-- V3__enhance_inventory_and_purchasing.sql
-- Dealer Management System: inventory, purchasing, supplier payments and market comparables.
--
-- IMPORTANT RECOVERY NOTES:
-- 1. This migration is tailored to the Aiven schema state reported by the user:
--    supplier enhancement columns already exist except supplier_code;
--    V3 parts/invoice/item columns and the three new tables are missing.
-- 2. Back up the database and verify the schema before running.
-- 3. This is a one-time Flyway migration recovery file, not a generally idempotent script.
--    Do not execute it repeatedly or run Flyway repair until the schema is reconciled.
-- 4. Ensure vehicles.id and job_cards.id are compatible with BIGINT before applying
--    the foreign keys below.
--
-- MySQL DDL can implicitly commit. If this migration fails partway through, inspect
-- the schema before attempting any retry.

-- ---------------------------------------------------------------------------
-- 1. Supplier code
-- Existing supplier enhancement columns are already present, so do not add them again.
-- ---------------------------------------------------------------------------

ALTER TABLE suppliers
    ADD COLUMN supplier_code VARCHAR(50) NULL AFTER id;

-- Populate stable codes for the existing supplier records before enforcing uniqueness.
UPDATE suppliers
SET supplier_code = CONCAT('SUP-', LPAD(id, 4, '0'))
WHERE supplier_code IS NULL;

CREATE UNIQUE INDEX uk_suppliers_supplier_code
    ON suppliers (supplier_code);

-- ---------------------------------------------------------------------------
-- 2. Spare-parts inventory enhancements
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3. Purchase-invoice enhancements
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 4. Purchase-invoice item enhancements
-- ---------------------------------------------------------------------------

ALTER TABLE purchase_invoice_items
    ADD COLUMN line_discount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER unit_price,
    ADD COLUMN tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER tax_percentage,
    ADD COLUMN landed_cost_allocation DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER tax_amount;

-- ---------------------------------------------------------------------------