-- V1__init_schema.sql
-- Enterprise Dealership Management System - Complete Relational Schema

-- ==========================================
-- 1. SECURITY & ACCESS CONTROL
-- ==========================================

CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    route VARCHAR(150),
    icon VARCHAR(50),
    order_index INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE role_menu_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_add BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    can_pay BOOLEAN NOT NULL DEFAULT FALSE,
    can_export BOOLEAN NOT NULL DEFAULT FALSE,
    can_change_status BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_role_menu UNIQUE (role_id, menu_id),
    CONSTRAINT fk_rmp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rmp_menu FOREIGN KEY (menu_id) REFERENCES menus (id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pw_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ==========================================
-- 2. VEHICLE MASTER & STATUS
-- ==========================================

CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL, -- CAR, BIKE
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    variant VARCHAR(100),
    manufacturing_year INT NOT NULL,
    registration_year INT NOT NULL,
    fuel_type VARCHAR(30) NOT NULL, -- PETROL, DIESEL, ELECTRIC, HYBRID, CNG
    transmission VARCHAR(30) NOT NULL, -- MANUAL, AUTOMATIC
    color VARCHAR(50) NOT NULL,
    odometer_reading INT NOT NULL DEFAULT 0,
    chassis_number VARCHAR(100) NOT NULL UNIQUE,
    engine_number VARCHAR(100) NOT NULL UNIQUE,
    rc_number VARCHAR(100),
    rc_expiry_date DATE,
    insurance_policy_number VARCHAR(100),
    insurance_validity_date DATE,
    ownership_type VARCHAR(20) NOT NULL, -- OWN, BROKER
    status VARCHAR(40) NOT NULL, -- PURCHASED, BROKER_LISTED, INSPECTION, JOB_CARD, REPAIR, READY_FOR_SALE, AVAILABLE, BOOKED, SOLD, SETTLEMENT_PENDING, SETTLED, DELIVERED, SERVICE_FOLLOWUP
    version BIGINT NOT NULL DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicle_status (status),
    INDEX idx_vehicle_ownership (ownership_type),
    INDEX idx_vehicle_brand_model (brand, model)
);

CREATE TABLE vehicle_purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL UNIQUE,
    purchase_date DATE NOT NULL,
    seller_name VARCHAR(150) NOT NULL,
    seller_phone VARCHAR(30) NOT NULL,
    seller_address VARCHAR(255),
    purchase_price DECIMAL(14,2) NOT NULL,
    purchase_expenses DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

CREATE TABLE vehicle_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- RC, INSURANCE, POLLUTION, SELLER_ID, OTHER
    document_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

CREATE TABLE vehicle_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    caption VARCHAR(150),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_photo_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

CREATE TABLE vehicle_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    reason VARCHAR(255),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_hist_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    INDEX idx_hist_vehicle_date (vehicle_id, changed_at)
);

-- ==========================================
-- 3. BROKERS & LISTINGS & SETTLEMENTS
-- ==========================================

CREATE TABLE brokers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150),
    address VARCHAR(255),
    id_proof_type VARCHAR(50),
    id_proof_document_path VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE broker_vehicle_listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    broker_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL UNIQUE,
    asking_price DECIMAL(14,2) NOT NULL,
    expected_selling_price DECIMAL(14,2) NOT NULL,
    commission_type VARCHAR(20) NOT NULL, -- FIXED, PERCENTAGE
    commission_rate DECIMAL(14,2) NOT NULL,
    listing_date DATE NOT NULL,
    listing_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bvl_broker FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bvl_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

-- ==========================================
-- 4. WORKSHOP & INSPECTIONS & JOB CARDS
-- ==========================================

CREATE TABLE inspections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    inspector_name VARCHAR(150) NOT NULL,
    inspection_date DATE NOT NULL,
    overall_remarks TEXT,
    overall_result VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_insp_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

CREATE TABLE inspection_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    checkpoint_name VARCHAR(100) NOT NULL, -- Engine, Gearbox, Clutch, Battery, Tyres, Brakes, Suspension, AC, Electrical, Lights, Body, Paint, Interior, Steering, Other
    result VARCHAR(30) NOT NULL, -- GOOD, NEED_REPAIR, REPLACE, NOT_AVAILABLE
    remarks VARCHAR(255),
    estimated_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_insp_item_insp FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
);

CREATE TABLE job_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_card_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id BIGINT NOT NULL,
    inspection_id BIGINT,
    assigned_staff VARCHAR(150),
    start_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    cost_responsibility VARCHAR(20) NOT NULL DEFAULT 'SHOP', -- SHOP, BROKER, SHARED
    shop_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    broker_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_jc_insp FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE SET NULL,
    INDEX idx_jc_status (status)
);

CREATE TABLE job_card_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_card_id BIGINT NOT NULL,
    task_description VARCHAR(255) NOT NULL,
    estimated_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    actual_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_jci_jc FOREIGN KEY (job_card_id) REFERENCES job_cards (id) ON DELETE CASCADE
);

-- ==========================================
-- 5. SUPPLIERS & INVENTORY & STOCK LEDGER
-- ==========================================

CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    mobile VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(255),
    gst_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE parts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL, -- PART, ACCESSORY
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS', -- PCS, LTR, SET
    purchase_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_part_sku (sku),
    INDEX idx_part_category (category)
);

CREATE TABLE purchase_invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    invoice_date DATE NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, CANCELLED
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIALLY_PAID, PAID
    document_path VARCHAR(255),
    notes TEXT,
    posted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pi_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT
);

CREATE TABLE purchase_invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_pii_invoice FOREIGN KEY (invoice_id) REFERENCES purchase_invoices (id) ON DELETE CASCADE,
    CONSTRAINT fk_pii_part FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE RESTRICT
);

CREATE TABLE stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    part_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL, -- PURCHASE_IN, JOB_CARD_USAGE, SERVICE_USAGE, ADJUSTMENT
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    reference_document VARCHAR(100),
    vehicle_id BIGINT,
    reason VARCHAR(255),
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sm_part FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sm_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL,
    INDEX idx_sm_part_date (part_id, created_at)
);

CREATE TABLE job_card_parts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_card_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_jcp_jc FOREIGN KEY (job_card_id) REFERENCES job_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_jcp_part FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE RESTRICT
);

CREATE TABLE job_card_labour (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_card_id BIGINT NOT NULL,
    description VARCHAR(200) NOT NULL,
    labour_hours DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    hourly_rate DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_jcl_jc FOREIGN KEY (job_card_id) REFERENCES job_cards (id) ON DELETE CASCADE
);

-- ==========================================
-- 6. COSTING & EXPENSES
-- ==========================================

CREATE TABLE vehicle_costs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL UNIQUE,
    purchase_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    purchase_expenses DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    shop_repair_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    accessories_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    labour_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    other_expenses DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_vehicle_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

CREATE TABLE shop_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    expense_date DATE NOT NULL,
    vehicle_id BIGINT,
    broker_id BIGINT,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    reference_no VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_se_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL,
    CONSTRAINT fk_se_broker FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE SET NULL
);

-- ==========================================
-- 7. CUSTOMERS & BOOKINGS & SALES & DELIVERY
-- ==========================================

CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150),
    address VARCHAR(255),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    id_proof_document_path VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    advance_amount DECIMAL(14,2) NOT NULL,
    booking_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED', -- BOOKED, CANCELLED, CONVERTED_TO_SALE
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bkg_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bkg_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT
);

CREATE TABLE sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL UNIQUE,
    sale_date DATE NOT NULL,
    sale_type VARCHAR(20) NOT NULL, -- DIRECT, FINANCE
    agreed_price DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    final_sale_price DECIMAL(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sale_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT,
    INDEX idx_sale_type (sale_type),
    INDEX idx_sale_status (status)
);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    sale_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- CASH, UPI, BANK_TRANSFER, CHEQUE, CARD
    transaction_reference VARCHAR(100),
    notes VARCHAR(255),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    INDEX idx_pay_sale (sale_id)
);

CREATE TABLE finance_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL UNIQUE,
    finance_company VARCHAR(150) NOT NULL,
    loan_account_number VARCHAR(100),
    loan_amount DECIMAL(14,2) NOT NULL,
    down_payment DECIMAL(14,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    tenure_months INT NOT NULL,
    emi_amount DECIMAL(14,2) NOT NULL,
    emi_due_day INT NOT NULL DEFAULT 5,
    loan_start_date DATE NOT NULL,
    loan_end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- PENDING, ACTIVE, OVERDUE, CLOSED
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fd_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
);

CREATE TABLE emi_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    finance_id BIGINT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(14,2) NOT NULL,
    principal_amount DECIMAL(14,2) NOT NULL,
    interest_amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE
    paid_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_emi_fin FOREIGN KEY (finance_id) REFERENCES finance_details (id) ON DELETE CASCADE,
    INDEX idx_emi_due_date (due_date, status)
);

CREATE TABLE deliveries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL UNIQUE,
    vehicle_id BIGINT NOT NULL UNIQUE,
    delivery_date DATE NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    odometer_at_delivery INT NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'DELIVERED', -- SCHEDULED, DELIVERED
    document_path VARCHAR(255),
    notes TEXT,
    delivered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_del_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    CONSTRAINT fk_del_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

-- ==========================================
-- 8. BROKER COMMISSIONS & SETTLEMENTS
-- ==========================================

CREATE TABLE broker_commissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    broker_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL UNIQUE,
    sale_id BIGINT NOT NULL UNIQUE,
    commission_type VARCHAR(20) NOT NULL,
    sale_price DECIMAL(14,2) NOT NULL,
    broker_settlement_basis DECIMAL(14,2) NOT NULL,
    gross_commission DECIMAL(14,2) NOT NULL,
    shop_repair_deduction DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    other_shop_expense_deduction DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    net_commission DECIMAL(14,2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bc_broker FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_bc_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
);

CREATE TABLE broker_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    broker_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL UNIQUE,
    sale_id BIGINT NOT NULL UNIQUE,
    sale_amount DECIMAL(14,2) NOT NULL,
    broker_amount DECIMAL(14,2) NOT NULL,
    gross_commission DECIMAL(14,2) NOT NULL,
    other_deductions DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    net_payable DECIMAL(14,2) NOT NULL,
    paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    balance_amount DECIMAL(14,2) NOT NULL,
    settlement_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PARTIALLY_PAID, PAID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bs_broker FOREIGN KEY (broker_id) REFERENCES brokers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    INDEX idx_bs_status (settlement_status)
);

CREATE TABLE broker_settlement_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_reference VARCHAR(100),
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bsp_settlement FOREIGN KEY (settlement_id) REFERENCES broker_settlements (id) ON DELETE CASCADE
);

-- ==========================================
-- 9. AFTER-SALES SERVICE & CUSTOMER HISTORY
-- ==========================================

CREATE TABLE service_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    sale_id BIGINT,
    service_date DATE NOT NULL,
    current_km INT NOT NULL,
    customer_complaint TEXT,
    inspection_notes TEXT,
    labour_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    parts_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    next_service_date DATE,
    next_service_km INT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- SCHEDULED, IN_PROGRESS, COMPLETED
    assigned_staff VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE SET NULL,
    INDEX idx_sr_service_date (service_date),
    INDEX idx_sr_next_service (next_service_date)
);

CREATE TABLE service_parts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_record_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_sp_service FOREIGN KEY (service_record_id) REFERENCES service_records (id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_part FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE RESTRICT
);

CREATE TABLE service_follow_ups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_record_id BIGINT,
    vehicle_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    follow_up_date DATE NOT NULL,
    outcome VARCHAR(255),
    next_follow_up_date DATE,
    remarks TEXT,
    assigned_staff VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING', -- UPCOMING, DUE, OVERDUE, CONTACTED, CLOSED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sfu_sr FOREIGN KEY (service_record_id) REFERENCES service_records (id) ON DELETE SET NULL,
    CONSTRAINT fk_sfu_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_sfu_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    INDEX idx_sfu_status_date (status, follow_up_date)
);

-- ==========================================
-- 10. AUDIT LOGS
-- ==========================================

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, STATUS_CHANGE, PAYMENT, SETTLEMENT
    changed_by VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_timestamp (timestamp)
);
