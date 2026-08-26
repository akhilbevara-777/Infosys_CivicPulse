package com.civicpulse.grievance;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "grievances",
       indexes = @Index(name = "idx_grv_citizen", columnList = "citizenId"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Grievance {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String grievanceId;

    @NotBlank private String citizenId;
    @NotBlank private String citizenName;
    @NotBlank private String ward;

    @Enumerated(EnumType.STRING) private GrievanceCategory category;
    @Enumerated(EnumType.STRING) private GrievanceSeverity severity;

    @NotBlank private String title;
    @Column(length = 4000) @NotBlank private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default private GrievanceStatus status = GrievanceStatus.SUBMITTED;

    private String assignedDept;
    private String assignedOfficer;

    private LocalDate     slaDeadline;
    @Builder.Default private int slaDays = 5;

    // Escalation
    private Integer       escalationLevel;
    private LocalDateTime escalatedAt;
    private String        escalationReason;

    // Resolution
    private String        resolution;
    private LocalDateTime resolvedAt;

    // Citizen response (for PENDING_CITIZEN)
    @Column(length = 4000)
    private String        citizenResponse;
    private LocalDateTime citizenResponseAt;

    // Officer message to citizen
    @Column(length = 2000)
    private String        officerMessage;

    // Reopen
    private String        reopenReason;
    private LocalDateTime reopenedAt;

    // Rejection
    private String        rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum GrievanceCategory {
        WATER_SUPPLY, ROAD_MAINTENANCE, ELECTRICITY, SANITATION,
        PUBLIC_SAFETY, HEALTHCARE, EDUCATION, OTHER
    }
    public enum GrievanceSeverity { LOW, MEDIUM, HIGH, CRITICAL }

    public enum GrievanceStatus {
        SUBMITTED, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS,
        PENDING_CITIZEN, ESCALATED, RESOLVED, CLOSED, REOPENED, REJECTED
    }

    /** Computed SLA status — not stored */
    public String getSlaStatus() {
        if (status == GrievanceStatus.RESOLVED || status == GrievanceStatus.CLOSED) return "RESOLVED";
        if (slaDeadline == null) return "ON_TRACK";
        long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), slaDeadline);
        if (daysLeft < 0)  return "BREACHED";
        if (daysLeft <= 1) return "DUE_SOON";
        return "ON_TRACK";
    }

    /** Computed days remaining — not stored */
    public long getSlaRemainingDays() {
        if (slaDeadline == null) return slaDays;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), slaDeadline);
    }
}
