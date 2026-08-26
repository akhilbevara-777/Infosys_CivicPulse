package com.civicpulse.welfare;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "welfare_applications",
       indexes = @Index(name = "idx_wel_app_citizen", columnList = "citizenId"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WelfareApplication {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true)
    private String appId;

    private String schemeId;
    private String schemeName;
    private String citizenId;
    private String citizenName;
    private String ward;

    @Enumerated(EnumType.STRING)
    @Builder.Default private WelfareStatus status = WelfareStatus.SUBMITTED;

    /** JSON: {fieldName: value} — dynamic application form data */
    @Column(length = 8000)
    private String formDataJson;

    /** JSON: [{name, verified, fileUrl}] */
    @Column(length = 4000)
    private String documentsJson;

    /** JSON: ["criterion1 passed", "criterion2 failed"] */
    @Column(length = 2000)
    private String eligibilityResultJson;

    private LocalDate     submittedAt;
    private LocalDate     approvedAt;
    private LocalDate     disbursedAt;
    private LocalDateTime updatedAt;
    private Double        disbursementAmount;
    private String        disbursementReference;
    private String        rejectionReason;
    private String        notes;

    public enum WelfareStatus {
        SUBMITTED, UNDER_VERIFICATION, ELIGIBILITY_CHECK,
        APPROVED, REJECTED, DISBURSEMENT_PENDING, DISBURSED
    }
}
