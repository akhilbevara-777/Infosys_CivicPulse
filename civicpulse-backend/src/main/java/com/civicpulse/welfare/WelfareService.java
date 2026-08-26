package com.civicpulse.welfare;

import com.civicpulse.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WelfareService {

    private final WelfareSchemeRepository      schemeRepo;
    private final WelfareApplicationRepository appRepo;
    private final WelAppIdSequenceRepository   seqRepo;
    private final NotificationService          notifService;

    // ─── Sequential WEL-YYYY-NNNNNN ID ───────────────────────────────────────
    @Transactional
    public String nextAppId() {
        WelAppIdSequence seq = seqRepo.findById(1)
            .orElseGet(() -> seqRepo.save(new WelAppIdSequence(1, 1L)));
        long n = seq.getNextVal();
        seq.setNextVal(n + 1);
        seqRepo.save(seq);
        return String.format("WEL-%d-%06d", LocalDate.now().getYear(), n);
    }

    // ─── Schemes ──────────────────────────────────────────────────────────────
    public List<WelfareScheme> getAllSchemes()               { return schemeRepo.findAll(); }
    public WelfareScheme getSchemeById(String id)            { return schemeRepo.findById(id).orElseThrow(() -> new RuntimeException("Scheme not found: " + id)); }
    public List<WelfareScheme> getSchemesByCategory(String c){ return schemeRepo.findByCategory(c); }

    // ─── Applications ─────────────────────────────────────────────────────────
    public List<WelfareApplication> getAllApplications()     { return appRepo.findAll(); }
    public List<WelfareApplication> getByCitizen(String cId){ return appRepo.findByCitizenId(cId); }

    @Transactional
    public WelfareApplication apply(String schemeId, String citizenId, String citizenName,
                                     String ward, String formDataJson, String documentsJson,
                                     String eligibilityResultJson) {
        WelfareScheme scheme = getSchemeById(schemeId);

        // Prevent duplicate active applications
        boolean dup = appRepo.findByCitizenId(citizenId).stream()
            .anyMatch(a -> a.getSchemeId().equals(schemeId)
                       && a.getStatus() != WelfareApplication.WelfareStatus.REJECTED);
        if (dup) throw new RuntimeException("You already have an active application for this scheme");

        // Server-side eligibility gate: reject if any required criterion marked ✗
        if (eligibilityResultJson != null && !eligibilityResultJson.isBlank()
                && eligibilityResultJson.contains("✗")) {
            throw new RuntimeException(
                "Eligibility check failed. You do not meet all mandatory criteria for this scheme.");
        }

        WelfareApplication app = WelfareApplication.builder()
            .appId(nextAppId())
            .schemeId(schemeId)
            .schemeName(scheme.getName())
            .citizenId(citizenId)
            .citizenName(citizenName)
            .ward(ward)
            .formDataJson(formDataJson != null ? formDataJson : "{}")
            .documentsJson(documentsJson != null ? documentsJson : "[]")
            .eligibilityResultJson(eligibilityResultJson)
            .status(WelfareApplication.WelfareStatus.SUBMITTED)
            .submittedAt(LocalDate.now())
            .updatedAt(LocalDateTime.now())
            .build();
        WelfareApplication saved = appRepo.save(app);
        notifService.welfareSubmitted(saved.getCitizenId(), saved.getAppId(), saved.getSchemeName());
        return saved;
    }

    @Transactional
    public WelfareApplication updateStatus(String id, WelfareApplication.WelfareStatus status,
                                            String notes, String rejectionReason,
                                            Double disbursementAmount, String disbursementRef) {
        WelfareApplication app = appRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Application not found: " + id));
        app.setStatus(status);
        app.setUpdatedAt(LocalDateTime.now());
        if (notes            != null) app.setNotes(notes);
        if (rejectionReason  != null) app.setRejectionReason(rejectionReason);
        if (disbursementRef  != null) app.setDisbursementReference(disbursementRef);

        LocalDate today = LocalDate.now();
        if (status == WelfareApplication.WelfareStatus.APPROVED
         || status == WelfareApplication.WelfareStatus.DISBURSED
         || status == WelfareApplication.WelfareStatus.DISBURSEMENT_PENDING) {
            if (app.getApprovedAt() == null) app.setApprovedAt(today);
        }
        if (status == WelfareApplication.WelfareStatus.DISBURSED) {
            app.setDisbursedAt(today);
            app.setDisbursementAmount(disbursementAmount);
        }
        WelfareApplication saved = appRepo.save(app);

        // Fire notifications
        switch (status) {
            case APPROVED            -> notifService.welfareApproved(saved.getCitizenId(), saved.getAppId(), saved.getSchemeName(), null);
            case REJECTED            -> notifService.welfareRejected(saved.getCitizenId(), saved.getAppId(), saved.getSchemeName(), rejectionReason);
            case DISBURSED           -> notifService.welfareDisbursed(saved.getCitizenId(), saved.getAppId(), saved.getSchemeName(), disbursementAmount, disbursementRef);
            default                  -> {}
        }
        return saved;
    }

    public record Stats(long totalSchemes, long activeSchemes, long totalBeneficiaries,
                        long totalBudget, long applications, long pending, double totalDisbursed) {}
    public Stats getStats() {
        long tb = schemeRepo.findAll().stream().mapToLong(WelfareScheme::getBeneficiariesCount).sum();
        long bu = schemeRepo.findAll().stream().mapToLong(WelfareScheme::getBudget).sum();
        Double d = appRepo.totalDisbursed();
        long pending = appRepo.countByStatus(WelfareApplication.WelfareStatus.SUBMITTED)
                     + appRepo.countByStatus(WelfareApplication.WelfareStatus.UNDER_VERIFICATION)
                     + appRepo.countByStatus(WelfareApplication.WelfareStatus.ELIGIBILITY_CHECK)
                     + appRepo.countByStatus(WelfareApplication.WelfareStatus.DISBURSEMENT_PENDING);
        return new Stats(schemeRepo.count(), schemeRepo.countByStatus(WelfareScheme.SchemeStatus.ACTIVE),
                         tb, bu, appRepo.count(), pending, d == null ? 0 : d);
    }
}
