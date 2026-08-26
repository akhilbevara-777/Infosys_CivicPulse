package com.civicpulse.application;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Immutable record of every status change — drives the citizen timeline view */
@Entity
@Table(name = "application_events",
       indexes = @Index(name = "idx_app_events_app_id", columnList = "applicationId"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationEvent {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String applicationId;

    @Enumerated(EnumType.STRING)
    private ServiceApplication.AppStatus status;

    /** Human-readable label shown in timeline */
    private String label;

    /** Optional description / system message */
    @Column(length = 1000)
    private String description;

    private String officerName;

    @Column(length = 2000)
    private String officerRemarks;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
