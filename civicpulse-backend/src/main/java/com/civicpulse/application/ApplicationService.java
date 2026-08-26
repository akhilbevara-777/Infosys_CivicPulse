package com.civicpulse.application;

import com.civicpulse.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository      repo;
    private final AppIdSequenceRepository    seqRepo;
    private final ApplicationEventRepository eventRepo;
    private final NotificationService        notifService;

    // ─── Static lookup maps ───────────────────────────────────────────────────
    static final Map<String, Integer> FEES = Map.ofEntries(
        Map.entry("Birth Certificate",     50),
        Map.entry("Death Certificate",     50),
        Map.entry("Income Certificate",    30),
        Map.entry("Residence Certificate", 30),
        Map.entry("Marriage Certificate",  100),
        Map.entry("Caste Certificate",     0),
        Map.entry("Trade License",         200),
        Map.entry("Building Permit",       500),
        Map.entry("Food License",          150),
        Map.entry("Event Permit",          75),
        Map.entry("Signage Permit",        50)
    );

    static final Map<String, Integer> PROCESSING_DAYS = Map.ofEntries(
        Map.entry("Birth Certificate",     3),
        Map.entry("Death Certificate",     2),
        Map.entry("Income Certificate",    7),
        Map.entry("Residence Certificate", 5),
        Map.entry("Marriage Certificate",  10),
        Map.entry("Caste Certificate",     14),
        Map.entry("Trade License",         21),
        Map.entry("Building Permit",       30),
        Map.entry("Food License",          15),
        Map.entry("Event Permit",          7),
        Map.entry("Signage Permit",        5)
    );

    private static final Map<String, String> DEPT_MAP = Map.ofEntries(
        Map.entry("Birth Certificate",     "Municipal Administration"),
        Map.entry("Death Certificate",     "Municipal Administration"),
        Map.entry("Income Certificate",    "Municipal Administration"),
        Map.entry("Residence Certificate", "Municipal Administration"),
        Map.entry("Marriage Certificate",  "Municipal Administration"),
        Map.entry("Caste Certificate",     "Municipal Administration"),
        Map.entry("Trade License",         "Municipal Administration"),
        Map.entry("Building Permit",       "Road & Infrastructure"),
        Map.entry("Food License",          "Public Health"),
        Map.entry("Event Permit",          "Municipal Administration"),
        Map.entry("Signage Permit",        "Municipal Administration")
    );

    private static final Map<String, String> PREFIXES = Map.ofEntries(
        Map.entry("Birth Certificate",     "BC"),
        Map.entry("Death Certificate",     "DC"),
        Map.entry("Income Certificate",    "IC"),
        Map.entry("Residence Certificate", "RC"),
        Map.entry("Marriage Certificate",  "MC"),
        Map.entry("Caste Certificate",     "CC"),
        Map.entry("Trade License",         "TL"),
        Map.entry("Building Permit",       "BP"),
        Map.entry("Food License",          "FL"),
        Map.entry("Event Permit",          "EP"),
        Map.entry("Signage Permit",        "SP")
    );

    private static final Map<ServiceApplication.AppStatus, List<ServiceApplication.AppStatus>> TRANSITIONS;
    static {
        Map<ServiceApplication.AppStatus, List<ServiceApplication.AppStatus>> m = new EnumMap<>(ServiceApplication.AppStatus.class);
        m.put(ServiceApplication.AppStatus.SUBMITTED,            List.of(ServiceApplication.AppStatus.UNDER_REVIEW, ServiceApplication.AppStatus.CANCELLED, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.UNDER_REVIEW,         List.of(ServiceApplication.AppStatus.DOCUMENT_VERIFICATION, ServiceApplication.AppStatus.DOCUMENTS_PENDING, ServiceApplication.AppStatus.PENDING_INFORMATION, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.DOCUMENT_VERIFICATION,List.of(ServiceApplication.AppStatus.DOCUMENTS_PENDING, ServiceApplication.AppStatus.VERIFIED, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.DOCUMENTS_PENDING,    List.of(ServiceApplication.AppStatus.DOCUMENT_VERIFICATION, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.PENDING_INFORMATION,  List.of(ServiceApplication.AppStatus.UNDER_REVIEW, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.VERIFIED,             List.of(ServiceApplication.AppStatus.APPROVED, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.APPROVED,             List.of(ServiceApplication.AppStatus.ISSUED, ServiceApplication.AppStatus.REJECTED));
        m.put(ServiceApplication.AppStatus.ISSUED,               List.of());
        m.put(ServiceApplication.AppStatus.REJECTED,             List.of());
        m.put(ServiceApplication.AppStatus.CANCELLED,            List.of());
        TRANSITIONS = Collections.unmodifiableMap(m);
    }

    private static final Map<ServiceApplication.AppStatus, String> STATUS_LABELS = Map.ofEntries(
        Map.entry(ServiceApplication.AppStatus.SUBMITTED,            "Application Submitted"),
        Map.entry(ServiceApplication.AppStatus.UNDER_REVIEW,         "Under Review"),
        Map.entry(ServiceApplication.AppStatus.DOCUMENT_VERIFICATION,"Document Verification"),
        Map.entry(ServiceApplication.AppStatus.DOCUMENTS_PENDING,    "Additional Documents Requested"),
        Map.entry(ServiceApplication.AppStatus.PENDING_INFORMATION,  "Additional Information Required"),
        Map.entry(ServiceApplication.AppStatus.VERIFIED,             "Documents Verified"),
        Map.entry(ServiceApplication.AppStatus.APPROVED,             "Application Approved"),
        Map.entry(ServiceApplication.AppStatus.REJECTED,             "Application Rejected"),
        Map.entry(ServiceApplication.AppStatus.ISSUED,               "Certificate Issued"),
        Map.entry(ServiceApplication.AppStatus.CANCELLED,            "Application Cancelled")
    );

    // ─── Sequential APP-YYYY-NNNNNN ID ────────────────────────────────────────
    @Transactional
    public String nextAppId() {
        AppIdSequence seq = seqRepo.findById(1).orElseGet(() -> seqRepo.save(new AppIdSequence(1, 1L)));
        long n = seq.getNextVal();
        seq.setNextVal(n + 1);
        seqRepo.save(seq);
        return String.format("APP-%d-%06d", LocalDate.now().getYear(), n);
    }

    // ─── Event helpers ────────────────────────────────────────────────────────
    private void recordEvent(String appId, ServiceApplication.AppStatus status,
                              String description, String officer, String remarks) {
        eventRepo.save(ApplicationEvent.builder()
            .applicationId(appId)
            .status(status)
            .label(STATUS_LABELS.getOrDefault(status, status.name()))
            .description(description)
            .officerName(officer)
            .officerRemarks(remarks)
            .createdAt(LocalDateTime.now())
            .build());
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────
    public List<ServiceApplication> getAll()                 { return repo.findAll(); }
    public ServiceApplication getById(String id)             { return repo.findById(id).orElseThrow(() -> new RuntimeException("Application not found: " + id)); }
    public List<ServiceApplication> getByCitizen(String cId) { return repo.findByCitizenId(cId); }
    public List<ServiceApplication> search(String q)         { return repo.search(q); }
    public List<ApplicationEvent>   getEvents(String appId)  { return eventRepo.findByApplicationIdOrderByCreatedAtAsc(appId); }

    @Transactional
    public ServiceApplication create(ServiceApplication app) {
        boolean exists = repo.findByCitizenId(app.getCitizenId()).stream()
            .anyMatch(a -> a.getType().equals(app.getType())
                       && a.getStatus() != ServiceApplication.AppStatus.REJECTED
                       && a.getStatus() != ServiceApplication.AppStatus.ISSUED
                       && a.getStatus() != ServiceApplication.AppStatus.CANCELLED);
        if (exists) throw new RuntimeException("You already have an active application for " + app.getType());

        app.setId(null);
        app.setAppId(nextAppId());
        app.setFee(FEES.getOrDefault(app.getType(), 50));
        app.setStatus(ServiceApplication.AppStatus.SUBMITTED);
        app.setSubmittedAt(LocalDate.now());
        app.setUpdatedAt(LocalDateTime.now());
        app.setDepartment(DEPT_MAP.getOrDefault(app.getType(), "Municipal Administration"));
        if (app.getDocumentsJson() == null) app.setDocumentsJson("[]");
        int days = PROCESSING_DAYS.getOrDefault(app.getType(), 7);
        app.setExpectedCompletionDate(LocalDate.now().plusDays(days));

        ServiceApplication saved = repo.save(app);
        recordEvent(saved.getId(), ServiceApplication.AppStatus.SUBMITTED,
            "Application received and registered in the system.", null, null);
        notifService.applicationSubmitted(saved.getCitizenId(), saved.getAppId(), saved.getType());
        return saved;
    }

    @Transactional
    public ServiceApplication updateStatus(String id, ServiceApplication.AppStatus newStatus,
                                            String notes, String rejectionReason,
                                            String missingDocsJson, String officer) {
        ServiceApplication app = getById(id);
        List<ServiceApplication.AppStatus> allowed = TRANSITIONS.getOrDefault(app.getStatus(), List.of());
        if (!allowed.contains(newStatus))
            throw new RuntimeException("Invalid transition: " + app.getStatus() + " → " + newStatus);

        app.setStatus(newStatus);
        app.setUpdatedAt(LocalDateTime.now());
        if (notes != null && !notes.isBlank())          app.setNotes(notes);
        if (rejectionReason != null && !rejectionReason.isBlank()) app.setRejectionReason(rejectionReason);
        if (missingDocsJson != null && !missingDocsJson.isBlank()) app.setMissingDocumentsJson(missingDocsJson);
        if (officer != null && !officer.isBlank())       app.setAssignedOfficer(officer);

        if (newStatus == ServiceApplication.AppStatus.APPROVED) app.setApprovedAt(LocalDate.now());

        if (newStatus == ServiceApplication.AppStatus.ISSUED) {
            if (app.getApprovedAt() == null) app.setApprovedAt(LocalDate.now());
            app.setIssuedAt(LocalDate.now());
            String prefix = PREFIXES.getOrDefault(app.getType(), "DOC");
            app.setCertificateNo(prefix + "-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000 + 1000)));
            app.setSignedBy("Commissioner Mehta");
            app.setSignatureId("SIG-" + System.currentTimeMillis());
            app.setVerificationCode(java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            app.setQrCode("CIVICPULSE:VERIFY:" + app.getCertificateNo() + ":" + app.getCitizenName().replace(" ", "_").toUpperCase());
        }

        ServiceApplication saved = repo.save(app);

        // Build event description
        String desc = notes;
        if (newStatus == ServiceApplication.AppStatus.DOCUMENTS_PENDING && missingDocsJson != null)
            desc = "Additional documents required: " + missingDocsJson.replaceAll("[\\[\\]\"]]", "");
        if (newStatus == ServiceApplication.AppStatus.REJECTED && rejectionReason != null)
            desc = "Reason: " + rejectionReason;

        recordEvent(saved.getId(), newStatus, desc, officer, notes);

        // Notifications
        switch (newStatus) {
            case APPROVED           -> notifService.applicationApproved(saved.getCitizenId(), saved.getAppId(), saved.getType());
            case REJECTED           -> notifService.applicationRejected(saved.getCitizenId(), saved.getAppId(), saved.getType(), rejectionReason);
            case ISSUED             -> notifService.certificateIssued(saved.getCitizenId(), saved.getAppId(), saved.getType(), saved.getCertificateNo());
            case DOCUMENTS_PENDING  -> notifService.documentRequired(saved.getCitizenId(), saved.getAppId(), saved.getType(), notes);
            default                 -> notifService.applicationStatusChanged(saved.getCitizenId(), saved.getAppId(), saved.getType(), newStatus.name());
        }
        return saved;
    }

    /** Simplified update for backwards-compat with existing admin controller calls */
    @Transactional
    public ServiceApplication updateStatus(String id, ServiceApplication.AppStatus newStatus, String notes) {
        return updateStatus(id, newStatus, notes, null, null, null);
    }

    @Transactional
    public ServiceApplication verifyDocument(String id, String docName) {
        ServiceApplication app = getById(id);
        String docs = app.getDocumentsJson();
        if (docs != null) {
            docs = docs.replace("\"name\":\"" + docName + "\",\"verified\":false",
                                "\"name\":\"" + docName + "\",\"verified\":true");
            app.setDocumentsJson(docs);
        }
        boolean allVerified = docs != null && !docs.contains("\"verified\":false");
        if (allVerified && (app.getStatus() == ServiceApplication.AppStatus.UNDER_REVIEW
                         || app.getStatus() == ServiceApplication.AppStatus.DOCUMENT_VERIFICATION
                         || app.getStatus() == ServiceApplication.AppStatus.DOCUMENTS_PENDING)) {
            app.setStatus(ServiceApplication.AppStatus.VERIFIED);
            recordEvent(app.getId(), ServiceApplication.AppStatus.VERIFIED,
                "All documents verified successfully.", null, null);
        }
        app.setUpdatedAt(LocalDateTime.now());
        return repo.save(app);
    }

    @Transactional
    public ServiceApplication markFeePaid(String id) {
        ServiceApplication app = getById(id);
        app.setFeePaid(true);
        app.setUpdatedAt(LocalDateTime.now());
        return repo.save(app);
    }

    @Transactional
    public ServiceApplication assignOfficer(String id, String officer, String dept) {
        ServiceApplication app = getById(id);
        app.setAssignedOfficer(officer);
        if (dept != null) app.setAssignedDept(dept);
        if (app.getStatus() == ServiceApplication.AppStatus.SUBMITTED)
            app.setStatus(ServiceApplication.AppStatus.UNDER_REVIEW);
        app.setUpdatedAt(LocalDateTime.now());
        return repo.save(app);
    }

    @Transactional
    public ServiceApplication cancel(String id, String citizenId, String reason) {
        ServiceApplication app = getById(id);
        if (!app.getCitizenId().equals(citizenId))
            throw new RuntimeException("Not authorised to cancel this application");
        if (app.getStatus() == ServiceApplication.AppStatus.APPROVED
         || app.getStatus() == ServiceApplication.AppStatus.ISSUED)
            throw new RuntimeException("Cannot cancel an approved or issued application");
        if (app.getStatus() == ServiceApplication.AppStatus.CANCELLED
         || app.getStatus() == ServiceApplication.AppStatus.REJECTED)
            throw new RuntimeException("Application is already " + app.getStatus().name().toLowerCase());
        app.setStatus(ServiceApplication.AppStatus.CANCELLED);
        app.setNotes(reason);
        app.setUpdatedAt(LocalDateTime.now());
        ServiceApplication saved = repo.save(app);
        recordEvent(saved.getId(), ServiceApplication.AppStatus.CANCELLED,
            reason != null && !reason.isBlank() ? "Cancelled by citizen: " + reason : "Cancelled by citizen.", null, null);
        return saved;
    }

    @Transactional
    public ServiceApplication trackDownload(String id) {
        ServiceApplication app = getById(id);
        app.setDownloadCount(app.getDownloadCount() + 1);
        return repo.save(app);
    }

    public record Stats(long total, long pending, long issued, long rejected, long approved, long cancelled, long certificates, long permits) {}
    public Stats getStats() {
        long pending = repo.countByStatus(ServiceApplication.AppStatus.SUBMITTED)
                    + repo.countByStatus(ServiceApplication.AppStatus.UNDER_REVIEW)
                    + repo.countByStatus(ServiceApplication.AppStatus.DOCUMENT_VERIFICATION)
                    + repo.countByStatus(ServiceApplication.AppStatus.DOCUMENTS_PENDING)
                    + repo.countByStatus(ServiceApplication.AppStatus.PENDING_INFORMATION)
                    + repo.countByStatus(ServiceApplication.AppStatus.VERIFIED);
        return new Stats(
            repo.count(), pending,
            repo.countByStatus(ServiceApplication.AppStatus.ISSUED),
            repo.countByStatus(ServiceApplication.AppStatus.REJECTED),
            repo.countByStatus(ServiceApplication.AppStatus.APPROVED),
            repo.countByStatus(ServiceApplication.AppStatus.CANCELLED),
            repo.countByCategory(ServiceApplication.AppCategory.CERTIFICATE),
            repo.countByCategory(ServiceApplication.AppCategory.PERMIT)
        );
    }
}
