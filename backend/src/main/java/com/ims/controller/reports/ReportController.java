package com.ims.controller.reports;

import com.ims.common.ApiResponse;
import com.ims.dtos.reports.*;
import com.ims.service.impl.reports.ExcelReportService;
import com.ims.service.impl.reports.PdfReportService;
import com.ims.service.serviceInterface.reports.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics Exports", description = "Endpoints for multi-dimensional business reports, aggregated summaries, and Excel/PDF file exports")
public class ReportController {

    private final ReportService reportService;
    private final ExcelReportService excelReportService;
    private final PdfReportService pdfReportService;

    @GetMapping("/vehicles")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "Vehicle inventory report", description = "Generates comprehensive inventory report for Own and Broker vehicles, available vs sold")
    public ResponseEntity<ApiResponse<List<VehicleReportRow>>> getVehicleReport(
            @RequestParam(required = false) String ownershipType,
            @RequestParam(required = false) String status) {
        List<VehicleReportRow> report = reportService.getVehicleReport(ownershipType, status);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/sales")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "Sales transaction report", description = "Generates report of sales filtered by date range and sale type (DIRECT / FINANCE)")
    public ResponseEntity<ApiResponse<List<SalesReportRow>>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String saleType) {
        List<SalesReportRow> report = reportService.getSalesReport(fromDate, toDate, saleType);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/profit")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "Profitability and commission report", description = "Strictly segregates Own vehicle gross profit (Selling Price - Total Cost) and Broker vehicle Net Commission (Gross Commission - Shop Expenses)")
    public ResponseEntity<ApiResponse<List<ProfitReportRow>>> getProfitReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ProfitReportRow> report = reportService.getProfitReport(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/brokers")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "Broker sales and settlement report", description = "Generates report of broker listings, sales transactions, deductions, commissions and settlement balances")
    public ResponseEntity<ApiResponse<List<BrokerReportRow>>> getBrokerReport(
            @RequestParam(required = false) Long brokerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<BrokerReportRow> report = reportService.getBrokerReport(brokerId, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/stock")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "Inventory stock valuation report", description = "Generates parts and accessories current inventory, valuation and reorder threshold alerts")
    public ResponseEntity<ApiResponse<List<StockReportRow>>> getStockReport(
            @RequestParam(required = false) Boolean lowStockOnly) {
        List<StockReportRow> report = reportService.getStockReport(lowStockOnly);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/service")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'VIEW')")
    @Operation(summary = "After-sales service report", description = "Generates report of workshop service logs, parts consumed, and upcoming maintenance schedules")
    public ResponseEntity<ApiResponse<List<ServiceReportRow>>> getServiceReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ServiceReportRow> report = reportService.getServiceReport(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/{type}/export/excel")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'EXPORT')")
    @Operation(summary = "Export report to Excel", description = "Generates formatted Microsoft Excel (.xlsx) spreadsheet for any report type (vehicles, sales, profit, brokers, stock, service)")
    public ResponseEntity<byte[]> exportExcel(
            @PathVariable String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        List<String> headers = new ArrayList<>();
        List<List<Object>> rows = new ArrayList<>();
        String filename = type.toLowerCase() + "_report.xlsx";

        populateReportData(type, fromDate, toDate, headers, rows);

        byte[] bytes = excelReportService.generateExcelReport(type.toUpperCase() + " Report", headers, rows);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/{type}/export/pdf")
    @PreAuthorize("@permissionService.hasPermission('REPORTS', 'EXPORT')")
    @Operation(summary = "Export report to PDF", description = "Generates printable PDF report document for any report type (vehicles, sales, profit, brokers, stock, service)")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        List<String> headers = new ArrayList<>();
        List<List<Object>> rows = new ArrayList<>();
        String filename = type.toLowerCase() + "_report.pdf";

        populateReportData(type, fromDate, toDate, headers, rows);

        byte[] bytes = pdfReportService.generatePdfReport(type.toUpperCase() + " BUSINESS REPORT", headers, rows);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    private void populateReportData(String type, LocalDate from, LocalDate to, List<String> headers, List<List<Object>> rows) {
        switch (type.toLowerCase()) {
            case "vehicles":
                headers.addAll(List.of("ID", "Reg No", "Type", "Brand", "Model", "Year", "Fuel", "Ownership", "Status", "KM", "Price/Cost"));
                for (VehicleReportRow r : reportService.getVehicleReport(null, null)) {
                    rows.add(List.of(r.getVehicleId(), r.getRegistrationNumber(), r.getVehicleType(), r.getBrand(), r.getModel(), r.getManufacturingYear(), r.getFuelType(), r.getOwnershipType(), r.getStatus(), r.getOdometerReading(), r.getPurchasePriceOrAskingPrice()));
                }
                break;
            case "sales":
                headers.addAll(List.of("Sale No", "Date", "Customer", "Reg No", "Type", "Sale Type", "Final Price", "Paid", "Balance", "Status"));
                for (SalesReportRow r : reportService.getSalesReport(from, to, null)) {
                    rows.add(List.of(r.getSaleNumber(), r.getSaleDate(), r.getCustomerName(), r.getVehicleRegistrationNumber(), r.getOwnershipType(), r.getSaleType(), r.getFinalSalePrice(), r.getTotalPaid(), r.getBalanceDue(), r.getStatus()));
                }
                break;
            case "profit":
                headers.addAll(List.of("Reg No", "Brand", "Model", "Ownership", "Sale Date", "Sale Price", "Cost/Basis", "Shop Deductions", "Net Profit/Commission"));
                for (ProfitReportRow r : reportService.getProfitReport(from, to)) {
                    rows.add(List.of(r.getRegistrationNumber(), r.getVehicleBrand(), r.getVehicleModel(), r.getOwnershipType(), r.getSaleDate(), r.getSellingPrice(), r.getTotalCostOrSettlementBasis(), r.getShopRepairsAndExpenses(), r.getRecognizedGrossProfitOrNetCommission()));
                }
                break;
            case "brokers":
                headers.addAll(List.of("Broker", "Reg No", "Sale Date", "Sale Amt", "Basis", "Gross Comm", "Shop Deductions", "Net Comm", "Net Payable", "Paid", "Balance", "Status"));
                for (BrokerReportRow r : reportService.getBrokerReport(null, from, to)) {
                    rows.add(List.of(r.getBrokerName(), r.getVehicleRegistrationNumber(), r.getSaleDate(), r.getSaleAmount(), r.getBrokerSettlementBasis(), r.getGrossCommission(), r.getShopRepairDeduction(), r.getNetCommission(), r.getNetPayableToBroker(), r.getPaidToBroker(), r.getBalanceToBroker(), r.getSettlementStatus()));
                }
                break;
            case "stock":
                headers.addAll(List.of("Part SKU", "Part Name", "Category", "Unit", "Current Stock", "Min Threshold", "Buy Price", "Sell Price", "Valuation", "Low Stock"));
                for (StockReportRow r : reportService.getStockReport(null)) {
                    rows.add(List.of(r.getPartNumber(), r.getName(), r.getCategory(), r.getUnit(), r.getCurrentStock(), r.getMinStockThreshold(), r.getPurchasePrice(), r.getSellingPrice(), r.getInventoryValue(), r.isLowStock() ? "YES" : "NO"));
                }
                break;
            case "service":
                headers.addAll(List.of("Service No", "Date", "Customer", "Reg No", "KM", "Labour", "Parts", "Total", "Next Service", "Staff"));
                for (ServiceReportRow r : reportService.getServiceReport(from, to)) {
                    rows.add(List.of(r.getServiceNumber(), r.getServiceDate(), r.getCustomerName(), r.getVehicleRegistrationNumber(), r.getCurrentKm(), r.getLabourAmount(), r.getPartsAmount(), r.getTotalAmount(), r.getNextServiceDate() != null ? r.getNextServiceDate() : "", r.getAssignedStaff() != null ? r.getAssignedStaff() : ""));
                }
                break;
            default:
                throw new IllegalArgumentException("Unknown report type: " + type);
        }
    }
}
