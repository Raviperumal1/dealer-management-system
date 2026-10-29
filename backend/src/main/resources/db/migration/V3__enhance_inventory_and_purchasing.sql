-- V3__enhance_inventory_and_purchasing.sql
-- MySQL 8.x / Flyway migration.
--
-- This migration is intentionally idempotent for schema objects because the
-- original V3 partially ran before failing. It checks information_schema before
-- adding columns, indexes, or foreign keys.
--
-- IMPORTANT:
-- 1. Back up the database before deploying.
-- 2. Confirm Render and your SQL client use the same Aiven host/schema.
-- 3. This file only implements the enhancements present in the supplied V3.
--    It does NOT create supplier_payments, supplier_ledger_entries, or
--    market_comparables because those CREATE TABLE definitions were not in
--    the uploaded file.

DROP PROCEDURE IF EXISTS _v3_add_column_if_missing;
DROP PROCEDURE IF EXISTS _v3_add_index_if_missing;
DROP PROCEDURE IF EXISTS _v3_add_fk_if_missing;
DROP PROCEDURE IF EXISTS _v3_assert_supplier_codes_unique;

DELIMITER $$

CREATE PROCEDURE _v3_add_column_if_missing(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*)
      INTO v_count
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = p_table
       AND column_name = p_column;

    IF v_count = 0 THEN
        SET @v3_ddl = CONCAT(
            'ALTER TABLE `', REPLACE(p_table, '`', '``'),
            '` ADD COLUMN `', REPLACE(p_column, '`', '``'),
            '` ', p_definition
        );
        PREPARE v3_stmt FROM @v3_ddl;
        EXECUTE v3_stmt;
        DEALLOCATE PREPARE v3_stmt;
    END IF;
END$$

CREATE PROCEDURE _v3_add_index_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_ddl TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*)
      INTO v_count
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = p_table
       AND index_name = p_index;

    IF v_count = 0 THEN
        SET @v3_ddl = p_ddl;
        PREPARE v3_stmt FROM @v3_ddl;
        EXECUTE v3_stmt;
        DEALLOCATE PREPARE v3_stmt;
    END IF;
END$$

CREATE PROCEDURE _v3_add_fk_if_missing(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64),
    IN p_ddl TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*)
      INTO v_count
      FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE()
       AND table_name = p_table
       AND constraint_name = p_constraint
       AND constraint_type = 'FOREIGN KEY';

    IF v_count = 0 THEN
        SET @v3_ddl = p_ddl;
        PREPARE v3_stmt FROM @v3_ddl;
        EXECUTE v3_stmt;
        DEALLOCATE PREPARE v3_stmt;
    END IF;
END$$
