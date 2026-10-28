package com.ims.service.serviceInterface.reports;

import com.ims.dtos.reports.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<VehicleReportRow> getVehicleReport(String ownershipType, String status);
    List<SalesReportRow> getSalesReport(LocalDate fromDate, LocalDate toDate, String saleType);
    List<ProfitReportRow> getProfitReport(LocalDate fromDate, LocalDate toDate);
    List<BrokerReportRow> getBrokerReport(Long brokerId, LocalDate fromDate, LocalDate toDate);
    List<StockReportRow> getStockReport(Boolean lowStockOnly);
    List<ServiceReportRow> getServiceReport(LocalDate fromDate, LocalDate toDate);
}
