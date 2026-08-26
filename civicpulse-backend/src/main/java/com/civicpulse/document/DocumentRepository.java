package com.civicpulse.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {
    List<Document> findByOwnerIdentity(String ownerIdentity);
    List<Document> findByEntityIdAndEntityType(String entityId, Document.EntityType entityType);
    List<Document> findByOwnerIdentityAndEntityType(String ownerIdentity, Document.EntityType entityType);
    Optional<Document> findByDocumentIdAndOwnerIdentity(String documentId, String ownerIdentity);
}
