package com.ims.entity.finance;

import com.ims.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "finance_lenders")
public class FinanceLenderEntity extends BaseEntity {

    @Column(name = "lender_code", nullable = false, unique = true, length = 50)
    private String lenderCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "lender_type", nullable = false, length = 50)
    @Builder.Default
    private String lenderType = "BANK"; // BANK, NBFC, CAPTIVE, IN_HOUSE

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "supported_vehicle_types", length = 100)
    @Builder.Default
    private String supportedVehicleTypes = "ALL";

    @Column(name = "min_tenure_months")
    @Builder.Default
    private Integer minTenureMonths = 12;

    @Column(name = "max_tenure_months")
    @Builder.Default
    private Integer maxTenureMonths = 60;

    @Column(name = "indicative_interest_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal indicativeInterestRate = BigDecimal.valueOf(9.50);

    @Column(name = "processing_fee_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal processingFeePercentage = BigDecimal.valueOf(1.00);

    @Column(name = "dealer_commission_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal dealerCommissionPercentage = BigDecimal.valueOf(80.00);

    @Column(name = "commission_payout_basis", length = 50)
    @Builder.Default
    private String commissionPayoutBasis = "PERCENTAGE_OF_PROCESSING_FEE";

    @Column(name = "documentation_checklist", columnDefinition = "TEXT")
    private String documentationChecklist;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
