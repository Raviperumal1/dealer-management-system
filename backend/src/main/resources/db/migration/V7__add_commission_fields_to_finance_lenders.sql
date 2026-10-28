-- V7__add_commission_fields_to_finance_lenders.sql
-- Adds dealer commission share percentage and commission payout basis to finance_lenders

ALTER TABLE finance_lenders
ADD COLUMN dealer_commission_percentage DECIMAL(5,2) DEFAULT 80.00 AFTER processing_fee_percentage,
ADD COLUMN commission_payout_basis VARCHAR(50) DEFAULT 'PERCENTAGE_OF_PROCESSING_FEE' AFTER dealer_commission_percentage;
