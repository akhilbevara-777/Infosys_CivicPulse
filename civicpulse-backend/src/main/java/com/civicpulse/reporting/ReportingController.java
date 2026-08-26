package com.civicpulse.reporting;

import com.civicpulse.application.ApplicationService;
import com.civicpulse.budget.BudgetService;
import com.civicpulse.citizen.CitizenService;
import com.civicpulse.grievance.GrievanceService;
import com.civicpulse.welfare.WelfareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportingController {

    private final CitizenService    citizenService;
    private final GrievanceService  grievanceService;
    private final ApplicationService applicationService;
    private final BudgetService     budgetService;
    private final WelfareService    welfareService;

    /** Single endpoint returning all governance KPIs — matches M4 spec */
    @GetMapping("/governance")
    public Map<String, Object> governanceDashboard() {
        var cs  = citizenService.getStats();
        var gs  = grievanceService.getStats();
        var as  = applicationService.getStats();
        var bs  = budgetService.getStats();
        var ws  = welfareService.getStats();

        return Map.of(
            "citizens",     Map.of(
                "total", cs.total(), "active", cs.active(),
                "inactive", cs.inactive(), "suspended", cs.suspended()
            ),
            "grievances",   Map.of(
                "total", gs.total(), "pending", gs.pending(),
                "inProgress", gs.inProgress(), "escalated", gs.escalated(),
                "resolved", gs.resolved(), "resolutionRate", gs.resolutionRate()
            ),
            "applications", Map.of(
                "total", as.total(), "pending", as.pending(),
                "issued", as.issued(), "rejected", as.rejected(),
                "certificates", as.certificates(), "permits", as.permits()
            ),
            "budget",       Map.of(
                "totalAllocated", bs.totalAllocated(), "totalSpent", bs.totalSpent(),
                "available", bs.available(), "utilizationRate", bs.utilizationRate()
            ),
            "welfare",      Map.of(
                "totalSchemes", ws.totalSchemes(), "activeSchemes", ws.activeSchemes(),
                "totalBeneficiaries", ws.totalBeneficiaries(),
                "totalBudget", ws.totalBudget(), "totalDisbursed", ws.totalDisbursed(),
                "pendingApplications", ws.pending()
            ),
            "kpis", Map.of(
                "citizenSatisfaction", 4.7,
                "serviceSLA", 94,
                "revenueCollected", 12400000,
                "avgApprovalDays", 2.4
            )
        );
    }

    @GetMapping("/citizens")
    public CitizenService.Stats citizenReport() { return citizenService.getStats(); }

    @GetMapping("/grievances")
    public GrievanceService.Stats grievanceReport() { return grievanceService.getStats(); }

    @GetMapping("/applications")
    public ApplicationService.Stats applicationReport() { return applicationService.getStats(); }

    @GetMapping("/budget")
    public BudgetService.Stats budgetReport() { return budgetService.getStats(); }

    @GetMapping("/welfare")
    public WelfareService.Stats welfareReport() { return welfareService.getStats(); }
}
