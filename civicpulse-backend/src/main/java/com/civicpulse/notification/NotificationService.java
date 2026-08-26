package com.civicpulse.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    // ─── Create ───────────────────────────────────────────────────────────────
    public Notification create(String citizenId, Notification.NotifType type,
                                String title, String message,
                                String entityId, String entityType) {
        return repo.save(Notification.builder()
            .citizenId(citizenId)
            .type(type)
            .title(title)
            .message(message)
            .relatedEntityId(entityId)
            .relatedEntityType(entityType)
            .build());
    }

    // ─── Query ────────────────────────────────────────────────────────────────
    public List<Notification> getAllForCitizen(String citizenId) {
        return repo.findByCitizenIdOrderByCreatedAtDesc(citizenId);
    }

    public List<Notification> getLatestForCitizen(String citizenId, int limit) {
        return repo.findTopByCitizenId(citizenId, PageRequest.of(0, limit));
    }

    public long getUnreadCount(String citizenId) {
        return repo.countByCitizenIdAndIsRead(citizenId, false);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────
    @Transactional
    public void markRead(String notificationId) {
        repo.markRead(notificationId);
    }

    @Transactional
    public void markAllRead(String citizenId) {
        repo.markAllRead(citizenId);
    }

    // ─── Convenience builders (called by other services) ────────────────────

    public void grievanceSubmitted(String citizenId, String grievanceId, String title) {
        create(citizenId, Notification.NotifType.GRIEVANCE_SUBMITTED,
            "Grievance Submitted",
            "Your grievance \"" + title + "\" (" + grievanceId + ") has been received. We'll assign it shortly.",
            grievanceId, "GRIEVANCE");
    }

    public void grievanceStatusChanged(String citizenId, String grievanceId, String title, String newStatus) {
        create(citizenId, Notification.NotifType.GRIEVANCE_STATUS_CHANGED,
            "Grievance Status Updated",
            "Your grievance \"" + title + "\" (" + grievanceId + ") status changed to: " + newStatus.replace('_', ' '),
            grievanceId, "GRIEVANCE");
    }

    public void grievanceAssigned(String citizenId, String grievanceId, String title, String officer, String dept) {
        create(citizenId, Notification.NotifType.GRIEVANCE_ASSIGNED,
            "Grievance Assigned",
            "Your grievance \"" + title + "\" has been assigned to " + officer + " (" + dept + ").",
            grievanceId, "GRIEVANCE");
    }

    public void grievanceSLAWarning(String citizenId, String grievanceId, String title, long daysLeft) {
        create(citizenId, Notification.NotifType.GRIEVANCE_SLA_WARNING,
            "SLA Deadline Approaching",
            "Your grievance \"" + title + "\" (" + grievanceId + ") SLA deadline is in " + daysLeft + " day(s).",
            grievanceId, "GRIEVANCE");
    }

    public void grievanceSLABreached(String citizenId, String grievanceId, String title) {
        create(citizenId, Notification.NotifType.GRIEVANCE_SLA_BREACHED,
            "⚠ SLA Breached — Auto Escalated",
            "Your grievance \"" + title + "\" (" + grievanceId + ") has exceeded its SLA deadline and was auto-escalated.",
            grievanceId, "GRIEVANCE");
    }

    public void grievanceResolved(String citizenId, String grievanceId, String title, String resolution) {
        create(citizenId, Notification.NotifType.GRIEVANCE_RESOLVED,
            "Grievance Resolved ✓",
            "Your grievance \"" + title + "\" has been resolved. " + (resolution != null ? resolution : ""),
            grievanceId, "GRIEVANCE");
    }

    public void applicationSubmitted(String citizenId, String appId, String type) {
        create(citizenId, Notification.NotifType.APPLICATION_SUBMITTED,
            "Application Submitted",
            "Your " + type + " application (" + appId + ") has been received and is under review.",
            appId, "APPLICATION");
    }

    public void applicationStatusChanged(String citizenId, String appId, String type, String status) {
        create(citizenId, Notification.NotifType.APPLICATION_STATUS_CHANGED,
            "Application Status Updated",
            "Your " + type + " application (" + appId + ") status: " + status.replace('_', ' ') + ".",
            appId, "APPLICATION");
    }

    public void documentRequired(String citizenId, String appId, String type, String notes) {
        create(citizenId, Notification.NotifType.DOCUMENT_REQUIRED,
            "Additional Documents Required",
            "Your " + type + " application (" + appId + ") requires additional documents. " + (notes != null ? notes : ""),
            appId, "APPLICATION");
    }

    public void applicationApproved(String citizenId, String appId, String type) {
        create(citizenId, Notification.NotifType.APPLICATION_APPROVED,
            "Application Approved ✓",
            "Your " + type + " application (" + appId + ") has been approved.",
            appId, "APPLICATION");
    }

    public void applicationRejected(String citizenId, String appId, String type, String reason) {
        create(citizenId, Notification.NotifType.APPLICATION_REJECTED,
            "Application Rejected",
            "Your " + type + " application (" + appId + ") was rejected. " + (reason != null ? reason : ""),
            appId, "APPLICATION");
    }

    public void certificateIssued(String citizenId, String appId, String type, String certNo) {
        create(citizenId, Notification.NotifType.CERTIFICATE_ISSUED,
            "Certificate Issued 🎫",
            "Your " + type + " certificate has been issued. Certificate No: " + certNo + ".",
            appId, "APPLICATION");
    }

    public void welfareSubmitted(String citizenId, String appId, String scheme) {
        create(citizenId, Notification.NotifType.WELFARE_SUBMITTED,
            "Welfare Application Submitted",
            "Your application for " + scheme + " (" + appId + ") has been received.",
            appId, "WELFARE");
    }

    public void welfareApproved(String citizenId, String appId, String scheme, Double amount) {
        create(citizenId, Notification.NotifType.WELFARE_APPROVED,
            "Welfare Application Approved ✓",
            "Your application for " + scheme + " (" + appId + ") is approved."
                + (amount != null ? " Benefit: ₹" + String.format("%.0f", amount) : ""),
            appId, "WELFARE");
    }

    public void welfareRejected(String citizenId, String appId, String scheme, String reason) {
        create(citizenId, Notification.NotifType.WELFARE_REJECTED,
            "Welfare Application Rejected",
            "Your application for " + scheme + " was rejected. " + (reason != null ? reason : ""),
            appId, "WELFARE");
    }

    public void welfareDisbursed(String citizenId, String appId, String scheme, Double amount, String ref) {
        create(citizenId, Notification.NotifType.WELFARE_DISBURSED,
            "Welfare Benefit Disbursed 💰",
            "₹" + String.format("%.0f", amount != null ? amount : 0)
                + " for " + scheme + " has been credited. Ref: " + (ref != null ? ref : appId),
            appId, "WELFARE");
    }
}
