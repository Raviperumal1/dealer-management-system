-- V2__seed_default_data.sql
-- Seed default roles, menus, permission matrix, and baseline reference data

-- 1. Insert Default Roles
INSERT INTO roles (name, description, is_active) VALUES
('ROLE_ADMIN', 'Administrator with full system privileges', TRUE),
('ROLE_STAFF', 'Dealership operational staff with permission-based access', TRUE);

-- 2. Insert Standard System Menus
INSERT INTO menus (code, name, route, icon, order_index, is_active) VALUES
('DASHBOARD', 'Dashboard', '/dashboard', 'dashboard', 1, TRUE),
('VEHICLES', 'Vehicles & Purchases', '/vehicles', 'directions_car', 2, TRUE),
('BROKERS', 'Brokers & Settlements', '/brokers', 'handshake', 3, TRUE),
('WORKSHOP', 'Inspection & Job Cards', '/workshop', 'build', 4, TRUE),
('INVENTORY', 'Parts & Stock', '/inventory', 'inventory_2', 5, TRUE),
('SALES', 'Sales & Finance', '/sales', 'point_of_sale', 6, TRUE),
('CUSTOMERS', 'Customers', '/customers', 'people', 7, TRUE),
('SERVICE', 'Service & Follow-up', '/service', 'support_agent', 8, TRUE),
('REPORTS', 'Reports & Analytics', '/reports', 'analytics', 9, TRUE),
('ADMIN', 'Users & Permissions', '/admin', 'admin_panel_settings', 10, TRUE);

-- 3. Configure Role Menu Permission Matrix (As defined in PPT Slide 15)
-- Admin Permissions (Full access to all menus)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
FROM roles r, menus m
WHERE r.name = 'ROLE_ADMIN';

-- Staff Default Permissions
-- Dashboard: View only
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'DASHBOARD'
WHERE r.name = 'ROLE_STAFF';

-- Vehicles / Purchase: View, Add, Edit (No delete)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'VEHICLES'
WHERE r.name = 'ROLE_STAFF';

-- Brokers & Settlement: No access
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'BROKERS'
WHERE r.name = 'ROLE_STAFF';

-- Inspection & Job Card: Full access (View, Add, Edit, Change Status)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE
FROM roles r JOIN menus m ON m.code = 'WORKSHOP'
WHERE r.name = 'ROLE_STAFF';

-- Parts & Stock: Manage parts (View, Add, Edit, Adjust)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE
FROM roles r JOIN menus m ON m.code = 'INVENTORY'
WHERE r.name = 'ROLE_STAFF';

-- Sales & Finance: Create sale (View, Add, Edit)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'SALES'
WHERE r.name = 'ROLE_STAFF';

-- Customers: View, Add, Edit
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'CUSTOMERS'
WHERE r.name = 'ROLE_STAFF';

-- Service Follow-up: Full access (View, Add, Edit)
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'SERVICE'
WHERE r.name = 'ROLE_STAFF';

-- Reports: No access
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'REPORTS'
WHERE r.name = 'ROLE_STAFF';

-- Users, Roles, Permissions: No access
INSERT INTO role_menu_permissions (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_pay, can_export, can_change_status)
SELECT r.id, m.id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE
FROM roles r JOIN menus m ON m.code = 'ADMIN'
WHERE r.name = 'ROLE_STAFF';

-- 4. Initial Baseline Suppliers & Parts (For immediate workshop & inventory usage)
INSERT INTO suppliers (name, contact_person, mobile, email, address, gst_number, is_active) VALUES
('Apex Auto Spares Pvt Ltd', 'Ramesh Kumar', '+91 9876543210', 'sales@apexauto.com', 'Plot 45, Industrial Area, Chennai', '33AABCA1234F1Z1', TRUE),
('RideWell Accessories Ltd', 'Suresh Patel', '+91 9812345678', 'suresh@ridewell.com', 'Auto Nagar, Bangalore', '29AABCR5678K1Z2', TRUE);

INSERT INTO parts (sku, name, category, unit, purchase_price, selling_price, current_stock, low_stock_threshold, is_active) VALUES
('PART-BAT-001', 'Amaron 12V 45Ah Car Battery', 'PART', 'PCS', 4500.00, 5500.00, 10, 3, TRUE),
('PART-OIL-001', 'Castrol EDGE 5W-40 Synthetic Engine Oil (4L)', 'PART', 'PCS', 2200.00, 2800.00, 25, 5, TRUE),
('PART-BRK-001', 'Bosch Front Brake Pads Set', 'PART', 'SET', 1500.00, 2100.00, 15, 4, TRUE),
('PART-TYR-001', 'MRF ZVTV 185/65 R15 Car Tyre', 'PART', 'PCS', 3800.00, 4600.00, 8, 2, TRUE),
('ACC-FLM-001', '7D Premium Leatherette Floor Mats Set', 'ACCESSORY', 'SET', 2800.00, 4200.00, 12, 3, TRUE),
('ACC-COV-001', 'Waterproof All-Weather Vehicle Body Cover', 'ACCESSORY', 'PCS', 1200.00, 1900.00, 14, 4, TRUE);
