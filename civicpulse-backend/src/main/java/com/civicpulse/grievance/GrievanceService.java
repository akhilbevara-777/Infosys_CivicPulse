package com.civicpulse.grievance;

import com.civicpulse.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GrievanceService {

    private final GrievanceRepository        repo;
    private final GrievanceHistoryRepository historyRepo;
    private final NotificationService        notifService;

    private static final Map<Grievance.GrievanceSeverity, Integer> SLA_DAYS = Map.of(
        Grievance.GrievanceSeverity.CRITICAL, 1,
        Grievance.GrievanceSeverity.HIGH,     3,
        Grievance.GrievanceSeverity.MEDIUM,   7,
        Grievance.GrievanceSeverity.LOW,      14
    );

    private static final Map<Grievance.GrievanceCategory, String> DEPT_MAP = Map.of(
        Grievance.GrievanceCategory.WATER_SUPPLY,    "Water Department",
        Grievance.GrievanceCategory.ROAD_MAINTENANCE,"Road & Infrastructure",
        Grievance.GrievanceCategory.ELECTRICITY,     "Electricity Board",
        Grievance.GrievanceCategory.SANITATION,      "Sanitation Dept",
        Grievance.GrievanceCategory.HEALTHCARE,      "Public Health",
        Grievance.GrievanceCategory.EDUCATION,       "Education Dept",
        Grievance.GrievanceCategory.PUBLIC_SAFETY,   "Electricity Board",
        Grievance.GrievanceCategory.OTHER,           "Municipal Administration"
    );

    private static final Map<Grievance.GrievanceStatus, String> STATUS_LABELS = Map.ofEntries(
        Map.entry(Grievance.GrievanceStatus.SUBMITTED,       "Grievance Submitted"),
        Map.entry(Grievance.GrievanceStatus.ACKNOWLEDGED,    "Grievance Acknowledged"),
        Map.entry(Grievance.GrievanceStatus.ASSIGNED,        "Assigned to Department"),
        Map.entry(Grievance.GrievanceStatus.IN_PROGRESS,     "Under Investigation"),
        Map.entry(Grievance.GrievanceStatus.PENDING_CITIZEN, "Awaiting Citizen Response"),
        Map.entry(Grievance.GrievanceStatus.ESCALATED,       "Escalated"),
        Map.entry(Grievance.GrievanceStatus.RESOLVED,        "Grievance Resolved"),
        Map.entry(Grievance.GrievanceStatus.CLOSED,          "Grievance Closed"),
        Map.entry(Grievance.GrievanceStatus.REOPENED,        "Grievance Reopened"),
        Map.entry(Grievance.GrievanceStatus.REJECTED,        "Grievance Rejected")
    );

    private static final Map<Grievance.GrievanceStatus, List<Grievance.GrievanceStatus>> TRANSITIONS;
    static {
        Map<Grievance.GrievanceStatus, List<Grievance.GrievanceStatus>> m = new EnumMap<>(Grievance.GrievanceStatus.class);
        m.put(Grievance.GrievanceStatus.SUBMITTED,       List.of(Grievance.GrievanceStatus.ACKNOWLEDGED, Grievance.GrievanceStatus.REJECTED));
        m.put(Grievance.GrievanceStatus.ACKNOWLEDGED,    List.of(Grievance.GrievanceStatus.ASSIGNED, Grievance.GrievanceStatus.REJECTED));
        m.put(Grievance.GrievanceStatus.ASSIGNED,        List.of(Grievance.GrievanceStatus.IN_PROGRESS, Grievance.GrievanceStatus.REJECTED));
        m.put(Grievance.GrievanceStatus.IN_PROGRESS,     List.of(Grievance.GrievanceStatus.PENDING_CITIZEN, Grievance.GrievanceStatus.ESCALATED, Grievance.GrievanceStatus.RESOLVED, Grievance.GrievanceStatus.REJECTED));
        m.put(Grievance.GrievanceStatus.PENDING_CITIZEN, List.of(Grievance.GrievanceStatus.IN_PROGRESS, Grievance.GrievanceStatus.RESOLVED, Grievance.GrievanceStatus.CLOSED));
        m.put(Grievance.GrievanceStatus.ESCALATED,       List.of(Grievance.GrievanceStatus.IN_PROGRESS, Grievance.GrievanceStatus.RESOLVED, Grievance.GrievanceStatus.REJECTED));
        m.put(Grievance.GrievanceStatus.RESOLVED,        List.of(Grievance.GrievanceStatus.CLOSED, Grievance.GrievanceStatus.REOPENED));
        m.put(Grievance.GrievanceStatus.CLOSED,          List.of());
        m.put(Grievance.GrievanceStatus.REOPENED,        List.of(Grievance.GrievanceStatus.IN_PROGRESS, Grievance.GrievanceStatus.ASSIGNED));
        m.put(Grievance.GrievanceStatus.REJECTED,        List.of());
        TRANSITIONS = Collections.unmodifiableMap(m);
    }

    private void record(String gId, Grievance.GrievanceStatus status, String description,
                         String actor, String role, String remarks) {
        historyRepo.save(GrievanceHistory.builder()
            .grievanceId(gId)
            .status(status)
            .label(STATUS_LABELS.getOrDefault(status, status.name()))
            .description(description)
            .actorName(actor)
            .actorRole(role)
            .remarks(remarks)
            .createdAt(LocalDateTime.now())
            .build());
    }

    public List<Grievance>        getAll()               { return repo.findAll(); }
    public Grievance              getById(String id)     { return repo.findById(id).orElseThrow(() -> new RuntimeException("Grievance not found: " + id)); }
    public List<Grievance>        getByCitizen(String c) { return repo.findByCitizenId(c); }
    public List<Grievance>        search(String q)       { return repo.search(q); }
    public List<GrievanceHistory> getHistory(String gId) { return historyRepo.findByGrievanceIdOrderByCreatedAtAsc(gId); }

    @Transactional
    public Grievance create(Grievance g) {
        int slaDays = SLA_DAYS.getOrDefault(g.getSeverity(), 7);
        g.setId(null);
        g.setGrievanceId("GRV-" + LocalDate.now().getYear() + "-" + (800 + (int)(Math.random() * 200)));
        g.setAssignedDept(DEPT_MAP.getOrDefault(g.getCategory(), "Municipal Administration"));
        g.setSlaDays(slaDays);
        g.setSlaDeadline(LocalDate.now().plusDays(slaDays));
        g.setStatus(Grievance.GrievanceStatus.SUBMITTED);
        g.setCreatedAt(LocalDateTime.now());
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), Grievance.GrievanceStatus.SUBMITTED,
               "Grievance registered.", g.getCitizenName(), "CITIZEN", null);
        notifService.grievanceSubmitted(saved.getCitizenId(), saved.getGrievanceId(), saved.getTitle());
        return saved;
    }

    @Transactional
    public Grievance updateStatus(String id, Grievance.GrievanceStatus newStatus,
                                   String resolution, String officerMessage,
                                   String rejectionReason, String actor, String actorRole) {
        Grievance g = getById(id);
        List<Grievance.GrievanceStatus> allowed = TRANSITIONS.getOrDefault(g.getStatus(), List.of());
        if (!allowed.contains(newStatus))
            throw new RuntimeException("Invalid transition: " + g.getStatus() + " → " + newStatus);
        g.setStatus(newStatus);
        g.setUpdatedAt(LocalDateTime.now());
        if (resolution      != null && !resolution.isBlank())      g.setResolution(resolution);
        if (officerMessage  != null && !officerMessage.isBlank())  g.setOfficerMessage(officerMessage);
        if (rejectionReason != null && !rejectionReason.isBlank()) g.setRejectionReason(rejectionReason);
        if (newStatus == Grievance.GrievanceStatus.RESOLVED) g.setResolvedAt(LocalDateTime.now());
        if (newStatus == Grievance.GrievanceStatus.ESCALATED) g.setEscalatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        String desc = resolution      != null ? "Resolution: " + resolution
                    : officerMessage  != null ? officerMessage
                    : rejectionReason != null ? "Rejected: " + rejectionReason
                    : null;
        record(saved.getId(), newStatus, desc, actor, actorRole, officerMessage);

        // Notifications
        if (newStatus == Grievance.GrievanceStatus.RESOLVED)
            notifService.grievanceResolved(saved.getCitizenId(), saved.getGrievanceId(), saved.getTitle(), resolution);
        else if (newStatus == Grievance.GrievanceStatus.PENDING_CITIZEN)
            notifService.grievanceStatusChanged(saved.getCitizenId(), saved.getGrievanceId(), saved.getTitle(), "Action Required — please respond");
        else
            notifService.grievanceStatusChanged(saved.getCitizenId(), saved.getGrievanceId(), saved.getTitle(), newStatus.name());
        return saved;
    }

    @Transactional
    public Grievance updateStatus(String id, Grievance.GrievanceStatus status, String resolution) {
        return updateStatus(id, status, resolution, null, null, "Admin", "ADMIN");
    }

    @Transactional
    public Grievance escalate(String id, String reason) {
        Grievance g = getById(id);
        g.setStatus(Grievance.GrievanceStatus.ESCALATED);
        g.setEscalationLevel((g.getEscalationLevel() == null ? 0 : g.getEscalationLevel()) + 1);
        g.setEscalatedAt(LocalDateTime.now());
        g.setEscalationReason(reason);
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), Grievance.GrievanceStatus.ESCALATED,
               "Escalation L" + saved.getEscalationLevel() + ": " + reason, "System", "SYSTEM", reason);
        return saved;
    }

    @Transactional
    public Grievance assign(String id, String officer, String dept) {
        Grievance g = getById(id);
        g.setAssignedOfficer(officer);
        if (dept != null) g.setAssignedDept(dept);
        Grievance.GrievanceStatus next =
            g.getStatus() == Grievance.GrievanceStatus.SUBMITTED ? Grievance.GrievanceStatus.ACKNOWLEDGED
            : Grievance.GrievanceStatus.ASSIGNED;
        g.setStatus(next);
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), next, "Assigned to " + officer, "Admin", "ADMIN", null);
        notifService.grievanceAssigned(saved.getCitizenId(), saved.getGrievanceId(), saved.getTitle(),
            officer, dept != null ? dept : g.getAssignedDept());
        return saved;
    }

    @Transactional
    public Grievance citizenRespond(String id, String citizenId, String response) {
        Grievance g = getById(id);
        if (!g.getCitizenId().equals(citizenId)) throw new RuntimeException("Not authorised");
        if (g.getStatus() != Grievance.GrievanceStatus.PENDING_CITIZEN)
            throw new RuntimeException("Not awaiting citizen response");
        g.setCitizenResponse(response);
        g.setCitizenResponseAt(LocalDateTime.now());
        g.setStatus(Grievance.GrievanceStatus.IN_PROGRESS);
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), Grievance.GrievanceStatus.IN_PROGRESS,
               "Citizen responded.", g.getCitizenName(), "CITIZEN", response);
        return saved;
    }

    @Transactional
    public Grievance acceptResolution(String id, String citizenId) {
        Grievance g = getById(id);
        if (!g.getCitizenId().equals(citizenId)) throw new RuntimeException("Not authorised");
        if (g.getStatus() != Grievance.GrievanceStatus.RESOLVED)
            throw new RuntimeException("Grievance not resolved yet");
        g.setStatus(Grievance.GrievanceStatus.CLOSED);
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), Grievance.GrievanceStatus.CLOSED,
               "Citizen accepted resolution.", g.getCitizenName(), "CITIZEN", null);
        return saved;
    }

    @Transactional
    public Grievance reopen(String id, String citizenId, String reason) {
        Grievance g = getById(id);
        if (!g.getCitizenId().equals(citizenId)) throw new RuntimeException("Not authorised");
        if (g.getStatus() != Grievance.GrievanceStatus.RESOLVED)
            throw new RuntimeException("Only resolved grievances can be reopened");
        g.setStatus(Grievance.GrievanceStatus.REOPENED);
        g.setReopenReason(reason);
        g.setReopenedAt(LocalDateTime.now());
        g.setUpdatedAt(LocalDateTime.now());
        Grievance saved = repo.save(g);
        record(saved.getId(), Grievance.GrievanceStatus.REOPENED,
               "Reopened: " + reason, g.getCitizenName(), "CITIZEN", null);
        return saved;
    }

    @Transactional
    public int runSLACheck() {
        int breached = 0;
        for (Grievance g : repo.findAll()) {
            if (g.getStatus() == Grievance.GrievanceStatus.RESOLVED
             || g.getStatus() == Grievance.GrievanceStatus.CLOSED
             || g.getStatus() == Grievance.GrievanceStatus.REJECTED
             || g.getStatus() == Grievance.GrievanceStatus.ESCALATED) continue;
            if (g.getSlaDeadline() != null && g.getSlaDeadline().isBefore(LocalDate.now())) {
                g.setStatus(Grievance.GrievanceStatus.ESCALATED);
                g.setEscalationLevel((g.getEscalationLevel() == null ? 0 : g.getEscalationLevel()) + 1);
                g.setEscalatedAt(LocalDateTime.now());
                g.setEscalationReason("SLA deadline exceeded — auto escalated");
                g.setUpdatedAt(LocalDateTime.now());
                repo.save(g);
                record(g.getId(), Grievance.GrievanceStatus.ESCALATED,
                       "SLA breached — auto-escalated.", "System", "SYSTEM", null);
                breached++;
            }
        }
        return breached;
    }

    public record Stats(long total, long pending, long inProgress, long escalated, long resolved, int resolutionRate) {}
    public Stats getStats() {
        long total    = repo.count();
        long pending  = repo.countByStatus(Grievance.GrievanceStatus.SUBMITTED)
                      + repo.countByStatus(Grievance.GrievanceStatus.ACKNOWLEDGED)
                      + repo.countByStatus(Grievance.GrievanceStatus.ASSIGNED);
        long inProg   = repo.countByStatus(Grievance.GrievanceStatus.IN_PROGRESS)
                      + repo.countByStatus(Grievance.GrievanceStatus.PENDING_CITIZEN)
                      + repo.countByStatus(Grievance.GrievanceStatus.REOPENED);
        long escalated= repo.countByStatus(Grievance.GrievanceStatus.ESCALATED);
        long resolved = repo.countByStatus(Grievance.GrievanceStatus.RESOLVED)
                      + repo.countByStatus(Grievance.GrievanceStatus.CLOSED);
        int rate      = total == 0 ? 0 : (int)((resolved * 100) / total);
        return new Stats(total, pending, inProg, escalated, resolved, rate);
    }
}
