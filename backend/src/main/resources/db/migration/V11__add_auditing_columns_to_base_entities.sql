-- V11__add_auditing_columns_to_base_entities.sql
-- Ensure all entities inheriting from BaseEntity have created_by and updated_by columns

DROP PROCEDURE IF EXISTS add_auditing_columns_if_missing;

DELIMITER $$
CREATE PROCEDURE add_auditing_columns_if_missing(IN target_table VARCHAR(64))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = target_table 
          AND COLUMN_NAME = 'created_by'
    ) THEN
        SET @sql_cb = CONCAT('ALTER TABLE `', target_table, '` ADD COLUMN `created_by` VARCHAR(255) NULL');
        PREPARE stmt_cb FROM @sql_cb;
        EXECUTE stmt_cb;
        DEALLOCATE PREPARE stmt_cb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = target_table 
          AND COLUMN_NAME = 'updated_by'
    ) THEN
        SET @sql_ub = CONCAT('ALTER TABLE `', target_table, '` ADD COLUMN `updated_by` VARCHAR(255) NULL');
        PREPARE stmt_ub FROM @sql_ub;
        EXECUTE stmt_ub;
        DEALLOCATE PREPARE stmt_ub;
    END IF;
END$$
DELIMITER ;

-- Call for all tables that map to BaseEntity subclasses
CALL add_auditing_columns_if_missing('bookings');
CALL add_auditing_columns_if_missing('broker_settlements');
CALL add_auditing_columns_if_missing('broker_vehicle_listings');
CALL add_auditing_columns_if_missing('brokers');
CALL add_auditing_columns_if_missing('customers');
CALL add_auditing_columns_if_missing('deliveries');
CALL add_auditing_columns_if_missing('emi_schedules');
CALL add_auditing_columns_if_missing('finance_applications');
CALL add_auditing_columns_if_missing('finance_details');
CALL add_auditing_columns_if_missing('finance_lenders');
CALL add_auditing_columns_if_missing('inspections');
CALL add_auditing_columns_if_missing('job_cards');
CALL add_auditing_columns_if_missing('lender_commission_receipts');
CALL add_auditing_columns_if_missing('lender_commissions');
CALL add_auditing_columns_if_missing('loan_documents');
CALL add_auditing_columns_if_missing('market_comparables');
CALL add_auditing_columns_if_missing('parts');
CALL add_auditing_columns_if_missing('purchase_invoice_items');
CALL add_auditing_columns_if_missing('purchase_invoices');
CALL add_auditing_columns_if_missing('roles');
CALL add_auditing_columns_if_missing('sales');
CALL add_auditing_columns_if_missing('service_follow_ups');
CALL add_auditing_columns_if_missing('service_parts');
CALL add_auditing_columns_if_missing('service_records');
CALL add_auditing_columns_if_missing('stock_movements');
CALL add_auditing_columns_if_missing('supplier_ledger_entries');
CALL add_auditing_columns_if_missing('supplier_payments');
CALL add_auditing_columns_if_missing('suppliers');
CALL add_auditing_columns_if_missing('users');
CALL add_auditing_columns_if_missing('vehicle_purchases');
CALL add_auditing_columns_if_missing('vehicles');

DROP PROCEDURE IF EXISTS add_auditing_columns_if_missing;
