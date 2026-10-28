# AutoManage Pro DMS — Postman Collection & API Suite

This folder contains the complete, production-ready Postman collection and environment files for testing all REST endpoints of the **AutoManage Pro Dealership Management System (DMS)**.

## Files Included:
1. `AutoManage_Pro_DMS.postman_collection.json` — Complete API collection organized by feature module.
2. `AutoManage_Pro_DMS.postman_environment.json` — Local environment variables (`baseUrl`, `authToken`, `adminUsername`, `adminPassword`).

## Quick Setup Instructions:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop both JSON files:
   - `AutoManage_Pro_DMS.postman_collection.json`
   - `AutoManage_Pro_DMS.postman_environment.json`
4. Select the **"AutoManage Pro DMS - Local Environment"** in the top-right environment selector.
5. In the collection, navigate to **Authentication -> Login with credentials** and click **Send**.
6. The test script will **automatically extract and store the JWT access token** into the `{{authToken}}` variable.
7. You can now execute any endpoint in any folder without manually copying or pasting tokens!

## API Modules Covered:
- **Authentication**: Login, Token Refresh, Logout, Change Password, Profile (/me)
- **Dashboard**: KPI Summary, Sales Trends, Fast-Moving Stock, Workshop Metrics
- **Vehicle Inventory**: CRUD for Cars & Bikes, Own Purchase vs Broker Consignment, Status Transitions, History
- **Brokers**: Registration, Listings, Performance Dashboard
- **Settlements**: Broker Payouts, Commissions, Remaining Balances, Installments
- **Customers**: CRM, Contact Profiles, Purchase History
- **Inspections**: Multi-point Condition Checks, Grading, Cost Estimates
- **Workshop**: Job Cards, Status Workflows, Spare Parts Consumption, Labour Charges
- **Spare Parts & Stock**: Inventory, SKU Tracking, Low Stock Alerts, Reorders
- **Purchase Invoices**: Vendor Invoicing, Stock Inward Movements
- **Suppliers**: Parts & Spare Vendors
- **Sales & Bookings**: Vehicle Bookings, Sale Closures, Delivery Handover
- **Finance**: Bank Tie-ups, Loans, EMI Schedule Tracking & Installment Repayments
- **Costing & Expenses**: Vehicle P&L, Shop Expenses, Cost Allocations
- **Reports**: Financial Reports, Broker Performance, Workshop Utilization, Excel & PDF exports
- **User & Roles**: RBAC Permissions, User Accounts, Menus
