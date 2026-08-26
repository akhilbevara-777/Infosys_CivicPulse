package com.civicpulse.document;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents",
       indexes = {
           @Index(name = "idx_doc_owner",  columnList = "ownerIdentity"),
           @Index(name = "idx_doc_entity", columnList = "entityId"),
       })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String documentId;

    /** The citizen/user who owns this document */
    @Column(nullable = false)
    private String ownerIdentity;

    @Enumerated(EnumType.STRING)
    private IdentityType identityType;

    /** Human-readable name of the document (e.g. "Aadhaar Card") */
    @Column(nullable = false)
    private String documentType;

    /** Original filename from the client — stored for display only, NEVER used for path */
    private String originalFileName;

    /** Server-generated safe filename used for actual storage */
    @Column(nullable = false)
    private String storedFileName;

    /** MIME type validated server-side */
    private String mimeType;

    private long fileSize;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.UPLOADED;

    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private String rejectionReason;

    /** Reference to the entity this document belongs to (appId, grievanceId, etc.) */
    private String entityId;

    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    public enum IdentityType   { CITIZEN, OFFICER, ADMIN }
    public enum VerificationStatus { UPLOADED, UNDER_REVIEW, VERIFIED, REJECTED, REUPLOAD_REQUIRED }
    public enum EntityType { APPLICATION, WELFARE_APPLICATION, GRIEVANCE, PROFILE }
}
