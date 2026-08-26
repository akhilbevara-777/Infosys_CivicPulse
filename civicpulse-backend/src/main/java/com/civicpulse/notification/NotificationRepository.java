package com.civicpulse.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findByCitizenIdOrderByCreatedAtDesc(String citizenId);

    @Query("SELECT n FROM Notification n WHERE n.citizenId = :cId ORDER BY n.createdAt DESC")
    List<Notification> findTopByCitizenId(String cId, org.springframework.data.domain.Pageable page);

    long countByCitizenIdAndIsRead(String citizenId, boolean isRead);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.citizenId = :cId AND n.isRead = false")
    void markAllRead(String cId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id")
    void markRead(String id);
}
