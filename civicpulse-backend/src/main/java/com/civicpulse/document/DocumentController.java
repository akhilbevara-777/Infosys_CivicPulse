package com.civicpulse.document;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService service;

    // ── Upload ────────────────────────────────────────────────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> upload(
            @RequestParam MultipartFile file,
            @RequestParam String ownerIdentity,
            @RequestParam String documentType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) Document.EntityType entityType) {
        return ResponseEntity.ok(service.upload(file, ownerIdentity, documentType, entityId,
                entityType != null ? entityType : Document.EntityType.APPLICATION));
    }

    // ── List by owner ─────────────────────────────────────────────────────────
    @GetMapping
    public List<Document> getByOwner(@RequestParam String ownerId) {
        return service.getByOwner(ownerId);
    }

    // ── List by entity (e.g. all docs for APP-2026-000001) ────────────────────
    @GetMapping("/entity/{entityId}")
    public List<Document> getByEntity(@PathVariable String entityId,
                                       @RequestParam Document.EntityType entityType) {
        return service.getByEntity(entityId, entityType);
    }

    // ── Authorised download — backend streams the file, never exposes path ────
    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> download(
            @PathVariable String documentId,
            @RequestParam String requesterId) {
        Resource resource = service.download(documentId, requesterId);
        Document doc      = service.getAuthorised(documentId, requesterId);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(doc.getMimeType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + doc.getOriginalFileName() + "\"")
            .header("X-Content-Type-Options", "nosniff")
            .header("Cache-Control", "no-store, private")
            .body(resource);
    }

    // ── Replace (re-upload) ───────────────────────────────────────────────────
    @PutMapping(value = "/{documentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> replace(
            @PathVariable String documentId,
            @RequestParam String requesterId,
            @RequestParam MultipartFile file) {
        return ResponseEntity.ok(service.replace(documentId, requesterId, file));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable String documentId,
            @RequestParam String requesterId,
            @RequestParam(required = false, defaultValue = "false") boolean adminOverride) {
        service.delete(documentId, requesterId, adminOverride);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    // ── Admin: verify / reject ────────────────────────────────────────────────
    @PatchMapping("/{documentId}/verify")
    public ResponseEntity<Document> verify(
            @PathVariable String documentId,
            @RequestParam String officerName,
            @RequestParam Document.VerificationStatus status,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(service.verify(documentId, officerName, status, rejectionReason));
    }
}
