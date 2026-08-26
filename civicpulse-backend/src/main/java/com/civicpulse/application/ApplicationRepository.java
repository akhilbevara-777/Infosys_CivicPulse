package com.civicpulse.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<ServiceApplication, String> {
    List<ServiceApplication> findByCitizenId(String citizenId);
    List<ServiceApplication> findByStatus(ServiceApplication.AppStatus status);
    List<ServiceApplication> findByCategory(ServiceApplication.AppCategory category);

    @Query("SELECT a FROM ServiceApplication a WHERE " +
           "LOWER(a.citizenName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(a.appId) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(a.type) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<ServiceApplication> search(@Param("q") String q);

    long countByStatus(ServiceApplication.AppStatus status);
    long countByCategory(ServiceApplication.AppCategory category);
}
