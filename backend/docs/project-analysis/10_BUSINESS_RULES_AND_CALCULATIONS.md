# DEALEROS — Business Rules & Calculations (Document 10)

## 1. Direct Sales & Invoicing Calculations
- **Source**: [`SaleServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/sales/SaleServiceImpl.java), [`SaleCreatePage.jsx`](file:///d:/dealershipManagementSystem/dealership-frontend/src/features/sales/SaleCreatePage.jsx)
- **Net Sale Payable Formula**:
  $$\text{Net Payable} = \text{Agreed Price} - \text{Discount Amount}$$
- **Customer Outstanding Balance**:
  $$\text{Balance Due} = \text{Net Payable} - \text{Actual Customer Payments Received} - \text{Trade-In Credit}$$
- **Full Settlement Rule**:
  - A direct sale is marked `COMPLETED` if and only if $\text{Balance Due} \le 0.00$.
  - Partial payments are supported; uncollected balance keeps status at `CONFIRMED`.

---

## 2. In-House Finance & Compound Reducing-Balance EMI Formula
- **Source**: [`FinanceServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/finance/FinanceServiceImpl.java)
- **Amount Financed ($P$)**:
  $$P = \text{Vehicle Sale Amount} - \text{Customer Down Payment} - \text{Trade-In Credit} + \text{Capitalized Contract Fees}$$
- **Periodic Interest Rate ($r$)**:
  $$r = \frac{\text{Annual Nominal Interest Rate}}{12 \times 100}$$
- **Tenure ($n$)**: Number of monthly installments.
- **Monthly EMI ($E$)**:
  $$E = P \times r \times \frac{(1 + r)^n}{(1 + r)^n - 1} \quad (\text{if } r > 0)$$
  $$E = \frac{P}{n} \quad (\text{if } r = 0)$$
- **Monthly Breakdown**:
  $$\text{Interest Component}_i = \text{Opening Principal}_i \times r$$
  $$\text{Principal Component}_i = E - \text{Interest Component}_i$$
  $$\text{Closing Principal}_i = \text{Opening Principal}_i - \text{Principal Component}_i$$
- **Penny Reconciliation Rule**:
  On the final installment ($i = n$), $\text{Principal Component}_n$ is forced to equal $\text{Opening Principal}_n$, guaranteeing that closing principal reaches exactly `0.00` regardless of rounding fractions.

---

## 3. Early Foreclosure & Loan Settlement
- **Source**: [`FinanceServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/finance/FinanceServiceImpl.java)
- **Foreclosure Settlement Formula**:
  $$\text{Net Settlement} = \text{Principal Outstanding} + \text{Accrued Interest} + \text{Foreclosure Fee (2\%)} + \text{Overdue Arrears}$$
- **Closure Rule**:
  Upon receipt of payment, pending schedule records are marked settled, `status` transitions to `CLOSED`, and `closed_date` is recorded.

---

## 4. Consignment Broker Commission & Settlement
- **Source**: [`SaleServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/sales/SaleServiceImpl.java)
- **Gross Commission**:
  - If `CommissionType == FIXED`: $\text{Gross Commission} = \text{Agreed Fixed Amount}$
  - If `CommissionType == PERCENTAGE`: $\text{Gross Commission} = \text{Final Sale Price} \times \frac{\text{Commission Rate}}{100}$
- **Net Commission Retained by Dealership**:
  $$\text{Net Commission} = \text{Gross Commission} - \text{Shop-Borne Repair Costs} - \text{Shop Consignment Expenses}$$
- **Broker Net Payable**:
  $$\text{Broker Amount} = \text{Final Sale Price} - \text{Gross Commission}$$
  $$\text{Net Payable to Broker} = \text{Broker Amount} - \text{Broker-Funded Repair Deductions}$$

---

## 5. Vehicle Landed Cost & Profitability
- **Source**: [`VehicleCostingServiceImpl.java`](file:///d:/dealershipManagementSystem/src/main/java/com/ims/service/impl/costing/VehicleCostingServiceImpl.java)
- **Vehicle Landed Investment**:
  $$\text{Total Vehicle Cost} = \text{Procurement Purchase Price} + \sum \text{Job Card Costs} + \sum \text{Direct Shop Expenses}$$
- **Gross Profit Margin Upon Sale**:
  $$\text{Gross Profit} = \text{Final Sale Price} - \text{Total Vehicle Cost}$$
  $$\text{Margin \%} = \frac{\text{Gross Profit}}{\text{Final Sale Price}} \times 100$$
