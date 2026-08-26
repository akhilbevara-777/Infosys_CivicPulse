package com.civicpulse.application;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService       service;
    private final ApplicationSubmitService submitService;

    @GetMapping
    public List<ServiceApplication> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String citizenId) {
        if (citizenId != null) {
            try { return service.getByCitizen(citizenId); }
            catch (Exception e) { return List.of(); }
        }
        if (search != null && !search.isBlank()) return service.search(search);
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceApplication> getById(@PathVariable String id,
                                                       @RequestParam(required = false) String requesterId) {
        ServiceApplication app = service.getById(id);
        // Citizens must identify themselves — blocks cross-citizen reads
        if (requesterId != null && !app.getCitizenId().equals(requesterId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(app);
    }

    /** Timeline events for a specific application */
    @GetMapping("/{id}/events")
    public List<ApplicationEvent> getEvents(@PathVariable String id) {
        return service.getEvents(id);
    }

    /** Simple JSON create (admin / legacy) */
    @PostMapping
    public ResponseEntity<ServiceApplication> create(@Valid @RequestBody ServiceApplication app) {
        return ResponseEntity.ok(service.create(app));
    }

    /** Full citizen submission: multipart — files + JSON metadata */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceApplication> submit(
            @RequestParam String citizenId,
            @RequestParam String citizenName,
            @RequestParam String type,
            @RequestParam String category,
            @RequestParam String formDataJson,
            @RequestParam(required = false) Map<String, MultipartFile> files) {
        return ResponseEntity.ok(
            submitService.submit(citizenId, citizenName, type, category, formDataJson, files));
    }

    /** Enhanced status update supporting rejection reason, missing docs, officer */
    @PatchMapping("/{id}/status")
    public ServiceApplication updateStatus(
            @PathVariable String id,
            @RequestParam ServiceApplication.AppStatus status,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String rejectionReason,
            @RequestParam(required = false) String missingDocsJson,
            @RequestParam(required = false) String officer) {
        return service.updateStatus(id, status, notes, rejectionReason, missingDocsJson, officer);
    }

    @PatchMapping("/{id}/verify-document")
    public ServiceApplication verifyDocument(
            @PathVariable String id,
            @RequestParam String docName) {
        return service.verifyDocument(id, docName);
    }

    @PatchMapping("/{id}/fee-paid")
    public ServiceApplication markFeePaid(@PathVariable String id) {
        return service.markFeePaid(id);
    }

    @PatchMapping("/{id}/assign")
    public ServiceApplication assignOfficer(
            @PathVariable String id,
            @RequestParam String officer,
            @RequestParam(required = false) String dept) {
        return service.assignOfficer(id, officer, dept);
    }

    /** Citizen cancels their own application */
    @DeleteMapping("/{id}")
    public ServiceApplication cancel(
            @PathVariable String id,
            @RequestParam String citizenId,
            @RequestParam(required = false) String reason) {
        return service.cancel(id, citizenId, reason);
    }

    @PostMapping("/{id}/download")
    public ServiceApplication trackDownload(@PathVariable String id) {
        return service.trackDownload(id);
    }

    @GetMapping("/stats")
    public ApplicationService.Stats getStats() {
        return service.getStats();
    }
}
