package com.civicpulse.welfare;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/welfare")
@RequiredArgsConstructor
public class WelfareController {

    private final WelfareService service;

    // ── Schemes ───────────────────────────────────────────────────────────────
    @GetMapping("/schemes")
    public List<WelfareScheme> getSchemes(@RequestParam(required = false) String category) {
        return category != null ? service.getSchemesByCategory(category) : service.getAllSchemes();
    }

    @GetMapping("/schemes/{id}")
    public WelfareScheme getScheme(@PathVariable String id) {
        return service.getSchemeById(id);
    }

    // ── Applications ─────────────────────────────────────────────────────────
    @GetMapping("/applications")
    public List<WelfareApplication> getApplications(@RequestParam(required = false) String citizenId) {
        if (citizenId != null) {
            try { return service.getByCitizen(citizenId); }
            catch (Exception e) { return List.of(); }
        }
        return service.getAllApplications();
    }

    /**
     * Full submit: multipart with optional files + JSON form data + eligibility result.
     * Files keyed by document name.
     */
    @PostMapping(value = "/applications/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WelfareApplication> submit(
            @RequestParam String schemeId,
            @RequestParam String citizenId,
            @RequestParam String citizenName,
            @RequestParam String ward,
            @RequestParam(required = false) String formDataJson,
            @RequestParam(required = false) String eligibilityResultJson,
            @RequestParam(required = false) Map<String, MultipartFile> files) {

        // Store uploaded files, build documentsJson
        List<Map<String, Object>> docs = new ArrayList<>();
        if (files != null) {
            files.forEach((docName, file) -> {
                if (!file.isEmpty()) {
                    String fileUrl = storeFile(file, citizenId, docName);
                    Map<String, Object> doc = new LinkedHashMap<>();
                    doc.put("name",       docName);
                    doc.put("verified",   false);
                    doc.put("fileUrl",    fileUrl);
                    doc.put("fileName",   file.getOriginalFilename());
                    doc.put("fileSize",   file.getSize());
                    doc.put("uploadedAt", java.time.LocalDate.now().toString());
                    docs.add(doc);
                }
            });
        }
        String documentsJson = toJson(docs);

        WelfareApplication app = service.apply(schemeId, citizenId, citizenName, ward,
                                                formDataJson, documentsJson, eligibilityResultJson);
        return ResponseEntity.ok(app);
    }

    /** Legacy simple apply (no files) */
    @PostMapping("/applications")
    public ResponseEntity<WelfareApplication> applySimple(
            @RequestParam String schemeId,
            @RequestParam String citizenId,
            @RequestParam String citizenName,
            @RequestParam String ward) {
        return ResponseEntity.ok(service.apply(schemeId, citizenId, citizenName, ward, null, null, null));
    }

    @PatchMapping("/applications/{id}/status")
    public WelfareApplication updateStatus(
            @PathVariable String id,
            @RequestParam WelfareApplication.WelfareStatus status,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String rejectionReason,
            @RequestParam(required = false) Double disbursementAmount,
            @RequestParam(required = false) String disbursementRef) {
        return service.updateStatus(id, status, notes, rejectionReason, disbursementAmount, disbursementRef);
    }

    @GetMapping("/stats")
    public WelfareService.Stats getStats() { return service.getStats(); }

    // ── File storage helper ───────────────────────────────────────────────────
    private static final Set<String> ALLOWED = Set.of("application/pdf","image/jpeg","image/jpg","image/png");

    private String storeFile(MultipartFile file, String citizenId, String docName) {
        String ct = file.getContentType();
        if (ct == null || !ALLOWED.contains(ct.toLowerCase()))
            throw new RuntimeException("Invalid file type for: " + docName);
        if (file.getSize() > 5 * 1024 * 1024)
            throw new RuntimeException("File too large (max 5MB): " + docName);
        String safe = docName.replaceAll("[^a-zA-Z0-9]", "_");
        String ext  = Optional.ofNullable(file.getOriginalFilename())
            .filter(f -> f.contains(".")).map(f -> f.substring(f.lastIndexOf('.'))).orElse(".bin");
        String name = citizenId + "_" + safe + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get("uploads", "welfare", citizenId);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(name).toFile());
            return "/uploads/welfare/" + citizenId + "/" + name;
        } catch (IOException e) { throw new RuntimeException("Upload failed: " + e.getMessage()); }
    }

    private String toJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("{");
            var m = list.get(i);
            boolean f = true;
            for (var e : m.entrySet()) {
                if (!f) sb.append(",");
                sb.append("\"").append(e.getKey()).append("\":");
                Object v = e.getValue();
                if (v instanceof Boolean || v instanceof Number) sb.append(v);
                else sb.append("\"").append(String.valueOf(v).replace("\"","\\\"")).append("\"");
                f = false;
            }
            sb.append("}");
        }
        return sb.append("]").toString();
    }
}
