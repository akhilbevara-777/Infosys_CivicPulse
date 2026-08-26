package com.civicpulse.document;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository repo;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-size-mb:5}")
    private long maxFileSizeMb;

    // ─── Security: allowed MIME types and matching extensions ─────────────────
    private static final Map<String, String> ALLOWED = Map.of(
        "application/pdf", ".pdf",
        "image/jpeg",      ".jpg",
        "image/jpg",       ".jpg",
        "image/png",       ".png",
        "image/webp",      ".webp"
    );

    // ─── Query ────────────────────────────────────────────────────────────────
    public List<Document> getByOwner(String ownerId) {
        return repo.findByOwnerIdentity(ownerId);
    }

    public List<Document> getByEntity(String entityId, Document.EntityType entityType) {
        return repo.findByEntityIdAndEntityType(entityId, entityType);
    }

    /** Authorised fetch — only owner can retrieve metadata */
    public Document getAuthorised(String documentId, String requesterId) {
        return repo.findByDocumentIdAndOwnerIdentity(documentId, requesterId)
            .orElseThrow(() -> new RuntimeException("Document not found or access denied"));
    }

    // ─── Upload ───────────────────────────────────────────────────────────────
    @Transactional
    public Document upload(MultipartFile file, String ownerIdentity,
                            String documentType, String entityId,
                            Document.EntityType entityType) {

        if (file == null || file.isEmpty())
            throw new RuntimeException("File is empty");

        // 1. Server-side MIME validation (do NOT trust client Content-Type alone)
        String mime = file.getContentType();
        if (mime == null || !ALLOWED.containsKey(mime.toLowerCase()))
            throw new RuntimeException("Unsupported file type. Allowed: PDF, JPG, PNG, WebP");

        // 2. Extension double-check — prevents extension spoofing
        String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("upload");
        String clientExt    = originalName.contains(".")
            ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
            : "";
        String expectedExt  = ALLOWED.get(mime.toLowerCase());
        if (!clientExt.equals(expectedExt) && !clientExt.equals(".jpeg"))
            throw new RuntimeException("File extension does not match content type");

        // 3. Executable file blocklist
        Set<String> blockedExts = Set.of(".exe",".bat",".sh",".cmd",".php",".jsp",".js",".html",".xml",".svg");
        if (blockedExts.contains(clientExt))
            throw new RuntimeException("File type not permitted");

        // 4. Size check
        if (file.getSize() > maxFileSizeMb * 1024 * 1024)
            throw new RuntimeException("File too large. Max " + maxFileSizeMb + "MB");

        // 5. Generate safe server-side filename — never use client name for path
        String storedName = UUID.randomUUID() + expectedExt;

        // 6. Path traversal prevention — resolve inside the base dir, verify it stays inside
        Path baseDir = Paths.get(uploadDir, "documents", sanitize(ownerIdentity)).toAbsolutePath().normalize();
        Path dest    = baseDir.resolve(storedName).normalize();
        if (!dest.startsWith(baseDir))
            throw new RuntimeException("Path traversal attempt detected");

        try {
            Files.createDirectories(baseDir);
            file.transferTo(dest.toFile());
            log.info("Stored document [{}] {} → {}", entityType, documentType, dest);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }

        // 7. Persist metadata — file URL is NOT stored; access goes through the secure endpoint
        Document doc = Document.builder()
            .ownerIdentity(ownerIdentity)
            .identityType(Document.IdentityType.CITIZEN)
            .documentType(documentType)
            .originalFileName(sanitizeFilename(originalName))  // sanitized for display only
            .storedFileName(storedName)
            .mimeType(mime)
            .fileSize(file.getSize())
            .uploadedAt(LocalDateTime.now())
            .verificationStatus(Document.VerificationStatus.UPLOADED)
            .entityId(entityId)
            .entityType(entityType)
            .build();

        return repo.save(doc);
    }

    // ─── Authorised download ──────────────────────────────────────────────────
    /** Returns the file resource only after verifying ownership */
    public Resource download(String documentId, String requesterId) {
        Document doc = getAuthorised(documentId, requesterId);

        Path base = Paths.get(uploadDir, "documents", sanitize(requesterId)).toAbsolutePath().normalize();
        Path file = base.resolve(doc.getStoredFileName()).normalize();

        // Path traversal check
        if (!file.startsWith(base))
            throw new RuntimeException("Access denied");

        try {
            Resource res = new UrlResource(file.toUri());
            if (!res.exists() || !res.isReadable())
                throw new RuntimeException("File not found on server");
            return res;
        } catch (MalformedURLException e) {
            throw new RuntimeException("File access error: " + e.getMessage());
        }
    }

    // ─── Replace (re-upload) ──────────────────────────────────────────────────
    @Transactional
    public Document replace(String documentId, String requesterId, MultipartFile newFile) {
        Document doc = getAuthorised(documentId, requesterId);

        // Only allow replacement if status permits
        Set<Document.VerificationStatus> replaceable = Set.of(
            Document.VerificationStatus.UPLOADED,
            Document.VerificationStatus.REJECTED,
            Document.VerificationStatus.REUPLOAD_REQUIRED
        );
        if (!replaceable.contains(doc.getVerificationStatus()))
            throw new RuntimeException("Document cannot be replaced in status: " + doc.getVerificationStatus());

        // Delete old file
        deletePhysical(doc.getOwnerIdentity(), doc.getStoredFileName());

        // Upload new file — reuse upload logic
        Document updated = upload(newFile, requesterId, doc.getDocumentType(),
                                   doc.getEntityId(), doc.getEntityType());

        // Delete the extra record created by upload() and update original
        repo.delete(updated);
        doc.setStoredFileName(updated.getStoredFileName());
        doc.setOriginalFileName(updated.getOriginalFileName());
        doc.setMimeType(updated.getMimeType());
        doc.setFileSize(updated.getFileSize());
        doc.setUploadedAt(LocalDateTime.now());
        doc.setVerificationStatus(Document.VerificationStatus.UPLOADED);
        doc.setVerifiedBy(null);
        doc.setVerifiedAt(null);
        doc.setRejectionReason(null);
        return repo.save(doc);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    @Transactional
    public void delete(String documentId, String requesterId, boolean isAdmin) {
        Document doc = isAdmin
            ? repo.findById(documentId).orElseThrow(() -> new RuntimeException("Document not found"))
            : getAuthorised(documentId, requesterId);

        // Citizens can only delete unverified documents
        if (!isAdmin && doc.getVerificationStatus() == Document.VerificationStatus.VERIFIED)
            throw new RuntimeException("Cannot delete a verified document");

        deletePhysical(doc.getOwnerIdentity(), doc.getStoredFileName());
        repo.delete(doc);
        log.info("Deleted document {} by {}", documentId, requesterId);
    }

    // ─── Admin verification ───────────────────────────────────────────────────
    @Transactional
    public Document verify(String documentId, String officerName, Document.VerificationStatus status,
                            String rejectionReason) {
        Document doc = repo.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setVerificationStatus(status);
        doc.setVerifiedBy(officerName);
        doc.setVerifiedAt(LocalDateTime.now());
        if (status == Document.VerificationStatus.REJECTED && rejectionReason != null)
            doc.setRejectionReason(rejectionReason);
        return repo.save(doc);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private void deletePhysical(String ownerId, String storedName) {
        try {
            Path base = Paths.get(uploadDir, "documents", sanitize(ownerId)).toAbsolutePath().normalize();
            Path file = base.resolve(storedName).normalize();
            if (file.startsWith(base)) Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Could not delete physical file {}: {}", storedName, e.getMessage());
        }
    }

    /** Allow only alphanumerics, hyphens, underscores in path components */
    static String sanitize(String input) {
        return input == null ? "unknown" : input.replaceAll("[^a-zA-Z0-9\\-_]", "_");
    }

    /** Sanitize original filename for display — strip path separators */
    static String sanitizeFilename(String name) {
        return Paths.get(name).getFileName().toString()
            .replaceAll("[^a-zA-Z0-9.\\-_ ]", "_");
    }
}
