package com.civicpulse.grievance;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Immutable audit log — one row per status change */
@Entity
@Table(name = "grievance_history",
       indexes = @Index(name = "idx_grv_hist_gid", columnList = "grievanceId"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GrievanceHistory {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String grievanceId;

    @Enumerated(EnumType.STRING)
    private Grievance.GrievanceStatus status;

    private String label;

    @Column(length = 2000)
    private String description;

    private String actorName;
    private String actorRole;   // CITIZEN, OFFICER, ADMIN, SYSTEM

    @Column(length = 2000)
    private String remarks;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
