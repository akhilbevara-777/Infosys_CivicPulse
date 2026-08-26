package com.civicpulse.grievance;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grievances")
@RequiredArgsConstructor
public class GrievanceController {

    private final GrievanceService service;

    @GetMapping
    public List<Grievance> getAll(@RequestParam(required = false) String search,
                                   @RequestParam(required = false) String citizenId) {
        if (citizenId != null) {
            try { return service.getByCitizen(citizenId); }
            catch (Exception e) { return List.of(); }
        }
        if (search != null && !search.isBlank()) return service.search(search);
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Grievance> getById(@PathVariable String id,
                                              @RequestParam(required = false) String requesterId) {
        Grievance g = service.getById(id);
        // Citizens must pass their own ID — blocks cross-citizen reads
        if (requesterId != null && !g.getCitizenId().equals(requesterId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(g);
    }

    @GetMapping("/{id}/history")
    public List<GrievanceHistory> getHistory(@PathVariable String id) {
        return service.getHistory(id);
    }

    @PostMapping
    public ResponseEntity<Grievance> create(@Valid @RequestBody GrievanceRequest req) {
        Grievance g = new Grievance();
        g.setCitizenId(req.citizenId);
        g.setCitizenName(req.citizenName);
        g.setWard(req.ward);
        g.setCategory(req.category);
        g.setSeverity(req.severity);
        g.setTitle(req.title);
        g.setDescription(req.description);
        return ResponseEntity.ok(service.create(g));
    }

    @PatchMapping("/{id}/status")
    public Grievance updateStatus(
            @PathVariable String id,
            @RequestParam Grievance.GrievanceStatus status,
            @RequestParam(required = false) String resolution,
            @RequestParam(required = false) String officerMessage,
            @RequestParam(required = false) String rejectionReason,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String actorRole) {
        return service.updateStatus(id, status, resolution, officerMessage, rejectionReason,
                                     actor != null ? actor : "Admin",
                                     actorRole != null ? actorRole : "ADMIN");
    }

    @PostMapping("/{id}/escalate")
    public Grievance escalate(@PathVariable String id, @RequestParam String reason) {
        return service.escalate(id, reason);
    }

    @PatchMapping("/{id}/assign")
    public Grievance assign(@PathVariable String id,
                             @RequestParam String officer,
                             @RequestParam(required = false) String dept) {
        return service.assign(id, officer, dept);
    }

    @PostMapping("/{id}/respond")
    public Grievance citizenRespond(@PathVariable String id,
                                     @RequestParam String citizenId,
                                     @RequestParam String response) {
        return service.citizenRespond(id, citizenId, response);
    }

    @PostMapping("/{id}/accept-resolution")
    public Grievance acceptResolution(@PathVariable String id,
                                       @RequestParam String citizenId) {
        return service.acceptResolution(id, citizenId);
    }

    @PostMapping("/{id}/reopen")
    public Grievance reopen(@PathVariable String id,
                             @RequestParam String citizenId,
                             @RequestParam(required = false) String reason) {
        return service.reopen(id, citizenId, reason != null ? reason : "Not satisfied with resolution");
    }

    @PostMapping("/sla-check")
    public ResponseEntity<String> runSLACheck() {
        int n = service.runSLACheck();
        return ResponseEntity.ok(n + " grievances auto-escalated due to SLA breach");
    }

    @GetMapping("/stats")
    public GrievanceService.Stats getStats() {
        return service.getStats();
    }
}
