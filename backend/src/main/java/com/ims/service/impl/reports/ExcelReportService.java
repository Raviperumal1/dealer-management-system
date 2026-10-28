package com.ims.service.impl.reports;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Slf4j
@Service
public class ExcelReportService {

    public byte[] generateExcelReport(String sheetTitle, List<String> headers, List<List<Object>> dataRows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetTitle);

            // Header Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Create Header Row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerCellStyle);
            }

            // Create Data Rows
            int rowIdx = 1;
            for (List<Object> rowData : dataRows) {
                Row row = sheet.createRow(rowIdx++);
                for (int colIdx = 0; colIdx < rowData.size(); colIdx++) {
                    Cell cell = row.createCell(colIdx);
                    Object val = rowData.get(colIdx);
                    if (val == null) {
                        cell.setCellValue("");
                    } else if (val instanceof Number number) {
                        cell.setCellValue(number.doubleValue());
                    } else if (val instanceof Boolean b) {
                        cell.setCellValue(b);
                    } else {
                        cell.setCellValue(val.toString());
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Excel report: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating Excel report: " + e.getMessage(), e);
        }
    }
}
