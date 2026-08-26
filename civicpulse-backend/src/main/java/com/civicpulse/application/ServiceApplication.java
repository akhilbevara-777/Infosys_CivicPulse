package com.civicpulse.application;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_applications",
       indexes = @Index(name = "idx_app_citizen", columnList = "citizenId"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceApplication {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String appId;

    @NotBlank private String citizenId;
    @NotBlank private String citizenName;
    @NotBlank private String type;

    @Enumerated(EnumType.STRING)
    private AppCategory category;

    @Enumerated(EnumType.STRING)
    @Builder.Default private AppStatus status = AppStatus.SUBMITTED;

    /** JSON: [{name, verified, fileUrl, fileName, uploadedAt}] */
    @Column(length = 4000)
    private String documentsJson;

    /** JSON: {fieldName: fieldValue} */
    @Column(length = 8000)
    private String formDataJson;

    /** JSON: ["Doc A", "Doc B"] — set when status is DOCUMENTS_PENDING */
    @Column(length = 1000)
    private String missingDocumentsJson;

    private LocalDate  submittedAt;
    private LocalDate  approvedAt;
    private LocalDate  issuedAt;
    private LocalDate  expectedCompletionDate;
    private LocalDateTime updatedAt;

    private String certificateNo;
    private String department;

    @Builder.Default private int    fee       = 0;
    @Builder.Default private boolean feePaid  = false;

    private String assignedOfficer;
    private String assignedDept;

    @Column(length = 2000)
    private String notes;

    @Column(length = 1000)
    private String rejectionReason;

    private String signedBy;
    private String signatureId;
    private String verificationCode;
    private String qrCode;
    private LocalDate  validUntil;
    @Builder.Default private int downloadCount = 0;

    public enum AppCategory { CERTIFICATE, PERMIT }

    public enum AppStatus {
        SUBMITTED,
        UNDER_REVIEW,
        DOCUMENT_VERIFICATION,
        DOCUMENTS_PENDING,
        PENDING_INFORMATION,
        VERIFIED,
        APPROVED,
        REJECTED,
        ISSUED,
        CANCELLED
    }
}
