package com.ims.service.impl.reports;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class PdfReportService {

    public byte[] generatePdfReport(String reportTitle, List<String> headers, List<List<Object>> dataRows) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            // Document Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.DARK_GRAY);
            Paragraph title = new Paragraph(reportTitle, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph subtitle = new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + " | Enterprise Dealership System", subFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15);
            document.add(subtitle);

            // Table
            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);

            // Headers
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(41, 128, 185)); // Dealership Blue
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Data rows
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            boolean alternate = false;
            for (List<Object> rowData : dataRows) {
                Color bgColor = alternate ? new Color(245, 247, 250) : Color.WHITE;
                for (Object val : rowData) {
                    PdfPCell cell = new PdfPCell(new Phrase(val != null ? val.toString() : "", cellFont));
                    cell.setBackgroundColor(bgColor);
                    cell.setPadding(5);
                    table.addCell(cell);
                }
                alternate = !alternate;
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF report: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating PDF report: " + e.getMessage(), e);
        }
    }
}
