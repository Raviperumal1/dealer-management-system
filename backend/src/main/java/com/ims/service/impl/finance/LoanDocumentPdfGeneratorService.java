package com.ims.service.impl.finance;

import com.ims.entity.finance.EmiScheduleEntity;
import com.ims.entity.finance.FinanceDetailEntity;
import com.ims.entity.finance.LoanDocumentEntity;
import com.ims.entity.sales.CustomerEntity;
import com.ims.entity.vehicle.VehicleEntity;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class LoanDocumentPdfGeneratorService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final Color PRIMARY_COLOR = new Color(15, 23, 42); // Slate 900
    private static final Color ACCENT_BLUE = new Color(37, 99, 235); // Blue 600
    private static final Color BORDER_COLOR = new Color(226, 232, 240); // Slate 200
    private static final Color BG_LIGHT = new Color(248, 250, 252); // Slate 50

    /**
     * Generates an official, bank-grade No Objection Certificate (NOC) PDF.
     */
    public byte[] generateNocPdf(FinanceDetailEntity loan, LoanDocumentEntity docMeta) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            CustomerEntity customer = loan.getSale() != null ? loan.getSale().getCustomer() : null;
            VehicleEntity vehicle = loan.getSale() != null ? loan.getSale().getVehicle() : null;

            // 1. Header with Dealership / Finance Logo Bar
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{65f, 35f});

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, PRIMARY_COLOR);
            Font brandSub = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("DEALEROS AUTOMOTIVE PRIVATE FINANCE", brandFont));
            leftCell.addElement(new Paragraph("Corporate Finance Division | Certified Automobile Lending Partner\nGSTIN: 33AAAAA0000A1Z5 | CIN: U50100TN2026PTC123456", brandSub));
            headerTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Font refFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY);
            Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

            Paragraph refP = new Paragraph();
            refP.setAlignment(Element.ALIGN_RIGHT);
            refP.add(new Chunk("NOC REF: ", refFont));
            refP.add(new Chunk(docMeta.getDocumentReference() + "\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, ACCENT_BLUE)));
            refP.add(new Chunk("ISSUE DATE: ", refFont));
            refP.add(new Chunk((docMeta.getIssueDate() != null ? docMeta.getIssueDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT)) + "\n", valFont));
            refP.add(new Chunk("LOAN A/C: ", refFont));
            refP.add(new Chunk(loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId()), valFont));
            rightCell.addElement(refP);
            headerTable.addCell(rightCell);

            document.add(headerTable);

            // Divider Line
            LineSeparator sep = new LineSeparator(1.5f, 100, ACCENT_BLUE, Element.ALIGN_CENTER, -2);
            document.add(new Paragraph(" "));
            document.add(sep);
            document.add(new Paragraph(" "));

            // Title
            Font docTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, PRIMARY_COLOR);
            Paragraph title = new Paragraph("NO OBJECTION CERTIFICATE (NOC)", docTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Paragraph subHeader = new Paragraph("(Towards Full & Final Settlement of Vehicle Hypothecation)", subHeaderFont);
            subHeader.setAlignment(Element.ALIGN_CENTER);
            subHeader.setSpacingAfter(16);
            document.add(subHeader);

            // Addressee
            Paragraph toPara = new Paragraph();
            toPara.add(new Chunk("TO WHOMSOEVER IT MAY CONCERN / THE REGIONAL TRANSPORT OFFICER (RTO)\n\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            document.add(toPara);

            // Body Statement
            String custName = customer != null ? customer.getName() : "Customer";
            String custAddr = customer != null && customer.getAddress() != null ? customer.getAddress() : "Registered Borrower Address";
            String vehReg = vehicle != null && vehicle.getRegistrationNumber() != null ? vehicle.getRegistrationNumber() : "UNREGISTERED";
            String vehModel = vehicle != null ? (vehicle.getBrand() + " " + vehicle.getModel() + " (" + (vehicle.getRegistrationYear() != null ? vehicle.getRegistrationYear() : "") + ")") : "Motor Vehicle";
            String vin = vehicle != null && vehicle.getChassisNumber() != null ? vehicle.getChassisNumber() : "N/A";
            String engineNo = vehicle != null && vehicle.getEngineNumber() != null ? vehicle.getEngineNumber() : "N/A";
            String loanAmt = "₹ " + (loan.getLoanAmount() != null ? loan.getLoanAmount().toPlainString() : "0.00");
            String closeDt = loan.getClosedDate() != null ? loan.getClosedDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT);

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            bodyFont.setColor(30, 41, 59);

            Paragraph body = new Paragraph();
            body.setFont(bodyFont);
            body.setLeading(16f);
            body.add(new Chunk("This is to certify that Sri/Smt. "));
            body.add(new Chunk(custName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            body.add(new Chunk(", residing at " + custAddr + ", was granted an automotive finance facility of "));
            body.add(new Chunk(loanAmt, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            body.add(new Chunk(" under Loan Account Number "));
            body.add(new Chunk(loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            body.add(new Chunk(" towards the purchase/financing of the vehicle specified below:"));
            body.setSpacingAfter(12);
            document.add(body);

            // Vehicle & Loan Specification Table
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setWidths(new float[]{40f, 60f});
            detailsTable.setSpacingAfter(14);

            addTableRow(detailsTable, "Borrower Name / Customer ID", custName + (customer != null ? " (ID: #" + customer.getId() + ")" : ""));
            addTableRow(detailsTable, "Vehicle Registration Number", vehReg);
            addTableRow(detailsTable, "Vehicle Description (Make & Model)", vehModel);
            addTableRow(detailsTable, "Chassis / VIN Number", vin);
            addTableRow(detailsTable, "Engine Number", engineNo);
            addTableRow(detailsTable, "Sanctioned Loan Amount", loanAmt);
            addTableRow(detailsTable, "Loan Commencement Date", loan.getLoanStartDate() != null ? loan.getLoanStartDate().format(DATE_FMT) : "N/A");
            addTableRow(detailsTable, "Account Closure & Settlement Date", closeDt);
            addTableRow(detailsTable, "Outstanding Balance as on Date", "₹ 0.00 (NIL DUES)");
            addTableRow(detailsTable, "Clearance Status", "FULLY SETTLED & VERIFIED");

            document.add(detailsTable);

            // Official Clearance Declaration
            Paragraph certDeclaration = new Paragraph();
            certDeclaration.setFont(bodyFont);
            certDeclaration.setLeading(16f);
            certDeclaration.add("We hereby confirm that the said loan account has been ");
            certDeclaration.add(new Chunk("FULLY PAID OFF AND CLOSED", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(22, 101, 52))));
            certDeclaration.add(". There are no outstanding principal, interest, fees, or penal charges due against the borrower or the vehicle.\n\n");
            certDeclaration.add("We have ");
            certDeclaration.add(new Chunk("NO OBJECTION", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            certDeclaration.add(" to the concerned Regional Transport Authority (RTA/RTO) cancelling or removing our ");
            certDeclaration.add(new Chunk("Lien / Hypothecation", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR)));
            certDeclaration.add(" recorded in the Certificate of Registration (RC Book) of the aforementioned vehicle.\n\n");
            certDeclaration.add("This certificate is issued without any prejudice and upon realization of all dues as per company records.");
            certDeclaration.setSpacingAfter(25);
            document.add(certDeclaration);

            // Signatures Section
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            sigTable.setWidths(new float[]{50f, 50f});

            PdfPCell signLeft = new PdfPCell();
            signLeft.setBorder(Rectangle.NO_BORDER);
            signLeft.addElement(new Paragraph("Borrower Acknowledgment:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY)));
            signLeft.addElement(new Paragraph("\n\n___________________________________\nSignature of Borrower (" + custName + ")", FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY)));
            sigTable.addCell(signLeft);

            PdfPCell signRight = new PdfPCell();
            signRight.setBorder(Rectangle.NO_BORDER);
            signRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph authP = new Paragraph();
            authP.setAlignment(Element.ALIGN_RIGHT);
            authP.add(new Chunk("For DEALEROS AUTOMOTIVE FINANCE\n\n\n\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, PRIMARY_COLOR)));
            authP.add(new Chunk("___________________________________\nAuthorized Signatory & Seal\nCorporate Credit & Settlement Operations", FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY)));
            signRight.addElement(authP);
            sigTable.addCell(signRight);

            document.add(sigTable);

            // Professional Footer
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                    "This is an authentic system-generated document issued by DealerOS Enterprise Finance. Page 1 of 1",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate NOC PDF for loan #{}: {}", loan.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generating NOC PDF document: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a formal Repayment Schedule PDF with loan-level summary and installment table.
     */
    public byte[] generateRepaymentSchedulePdf(FinanceDetailEntity loan, List<EmiScheduleEntity> emis) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 25, 25, 25, 25);
            PdfWriter.getInstance(document, out);
            document.open();

            CustomerEntity customer = loan.getSale() != null ? loan.getSale().getCustomer() : null;
            VehicleEntity vehicle = loan.getSale() != null ? loan.getSale().getVehicle() : null;

            // Title
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, PRIMARY_COLOR);
            Paragraph brand = new Paragraph("DEALEROS AUTOMOTIVE LOAN REPAYMENT SCHEDULE", brandFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);

            Paragraph meta = new Paragraph(
                    "Loan A/C: " + (loan.getLoanAccountNumber() != null ? loan.getLoanAccountNumber() : ("LN-" + loan.getId())) +
                    " | Customer: " + (customer != null ? customer.getName() : "N/A") +
                    " | Vehicle: " + (vehicle != null ? vehicle.getRegistrationNumber() : "N/A") +
                    " | Generated: " + LocalDate.now().format(DATE_FMT),
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY)
            );
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(12);
            document.add(meta);

            // Summary Table
            PdfPTable sumTable = new PdfPTable(4);
            sumTable.setWidthPercentage(100);
            sumTable.setSpacingAfter(12);

            addHeaderCell(sumTable, "Sanctioned Principal");
            addHeaderCell(sumTable, "Interest Rate");
            addHeaderCell(sumTable, "Tenure");
            addHeaderCell(sumTable, "Monthly EMI");

            addValueCell(sumTable, "₹ " + loan.getLoanAmount());
            addValueCell(sumTable, loan.getInterestRate() + "% p.a.");
            addValueCell(sumTable, loan.getTenureMonths() + " Months");
            addValueCell(sumTable, "₹ " + loan.getEmiAmount());

            addHeaderCell(sumTable, "Principal Repaid");
            addHeaderCell(sumTable, "Interest Paid");
            addHeaderCell(sumTable, "Principal Outstanding");
            addHeaderCell(sumTable, "Account Status");

            addValueCell(sumTable, "₹ " + (loan.getTotalPrincipalPaid() != null ? loan.getTotalPrincipalPaid() : "0.00"));
            addValueCell(sumTable, "₹ " + (loan.getTotalInterestPaid() != null ? loan.getTotalInterestPaid() : "0.00"));
            addValueCell(sumTable, "₹ " + (loan.getPrincipalOutstanding() != null ? loan.getPrincipalOutstanding() : "0.00"));
            addValueCell(sumTable, loan.getStatus() != null ? loan.getStatus().name() : "ACTIVE");

            document.add(sumTable);

            // Installment Schedule Table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{7f, 15f, 15f, 15f, 15f, 13f, 10f, 10f});

            addScheduleHeaderCell(table, "#");
            addScheduleHeaderCell(table, "Due Date");
            addScheduleHeaderCell(table, "EMI (₹)");
            addScheduleHeaderCell(table, "Principal (₹)");
            addScheduleHeaderCell(table, "Interest (₹)");
            addScheduleHeaderCell(table, "Balance (₹)");
            addScheduleHeaderCell(table, "Status");
            addScheduleHeaderCell(table, "Paid On");

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            boolean alternate = false;

            if (emis != null) {
                for (EmiScheduleEntity e : emis) {
                    Color bg = alternate ? BG_LIGHT : Color.WHITE;
                    alternate = !alternate;

                    table.addCell(createScheduleCell(String.valueOf(e.getInstallmentNumber()), cellFont, bg, Element.ALIGN_CENTER));
                    table.addCell(createScheduleCell(e.getDueDate() != null ? e.getDueDate().format(DATE_FMT) : "-", cellFont, bg, Element.ALIGN_CENTER));
                    table.addCell(createScheduleCell(e.getEmiAmount() != null ? e.getEmiAmount().toPlainString() : "-", cellFont, bg, Element.ALIGN_RIGHT));
                    table.addCell(createScheduleCell(e.getPrincipalAmount() != null ? e.getPrincipalAmount().toPlainString() : "-", cellFont, bg, Element.ALIGN_RIGHT));
                    table.addCell(createScheduleCell(e.getInterestAmount() != null ? e.getInterestAmount().toPlainString() : "-", cellFont, bg, Element.ALIGN_RIGHT));
                    table.addCell(createScheduleCell(e.getPrincipalRemaining() != null ? e.getPrincipalRemaining().toPlainString() : "-", cellFont, bg, Element.ALIGN_RIGHT));

                    Color statusColor = "PAID".equalsIgnoreCase(e.getStatus()) ? new Color(22, 101, 52) : Color.DARK_GRAY;
                    Font statusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, statusColor);
                    table.addCell(createScheduleCell(e.getStatus(), statusFont, bg, Element.ALIGN_CENTER));
                    table.addCell(createScheduleCell(e.getPaidDate() != null ? e.getPaidDate().format(DATE_FMT) : "-", cellFont, bg, Element.ALIGN_CENTER));
                }
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Repayment Schedule PDF for loan #{}: {}", loan.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generating Repayment Schedule PDF: " + e.getMessage(), e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, PRIMARY_COLOR);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);

        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(BG_LIGHT);
        c1.setBorderColor(BORDER_COLOR);
        c1.setPadding(5f);

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "-", valFont));
        c2.setBorderColor(BORDER_COLOR);
        c2.setPadding(5f);

        table.addCell(c1);
        table.addCell(c2);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
        cell.setBackgroundColor(PRIMARY_COLOR);
        cell.setPadding(4f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addValueCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, ACCENT_BLUE)));
        cell.setPadding(4f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addScheduleHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
        cell.setBackgroundColor(new Color(30, 41, 59));
        cell.setPadding(5f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private PdfPCell createScheduleCell(String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(4f);
        cell.setHorizontalAlignment(align);
        return cell;
    }
}
