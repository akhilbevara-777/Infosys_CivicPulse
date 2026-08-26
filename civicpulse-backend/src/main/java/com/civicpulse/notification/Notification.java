package com.civicpulse.notification;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications",
       indexes = {
           @Index(name = "idx_notif_citizen", columnList = "citizenId"),
           @Index(name = "idx_notif_read",    columnList = "citizenId, isRead"),
       })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String notificationId;

    @Column(nullable = false) private String citizenId;

    @Enumerated(EnumType.STRING)
    private NotifType type;

    @Column(nullable = false) private String title;

    @Column(length = 1000)    private String message;

    private String relatedEntityId;
    private String relatedEntityType;   // GRIEVANCE | APPLICATION | WELFARE

    @Builder.Default private boolean isRead = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotifType {
        GRIEVANCE_SUBMITTED,
        GRIEVANCE_STATUS_CHANGED,
        GRIEVANCE_ASSIGNED,
        GRIEVANCE_SLA_WARNING,
        GRIEVANCE_SLA_BREACHED,
        GRIEVANCE_RESOLVED,
        APPLICATION_SUBMITTED,
        APPLICATION_STATUS_CHANGED,
        DOCUMENT_REQUIRED,
        APPLICATION_APPROVED,
        APPLICATION_REJECTED,
        CERTIFICATE_ISSUED,
        WELFARE_SUBMITTED,
        WELFARE_APPROVED,
        WELFARE_REJECTED,
        WELFARE_DISBURSED,
        GENERAL_INFORMATION,
        SYSTEM_ALERT
    }
}
