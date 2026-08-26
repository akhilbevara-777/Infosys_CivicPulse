package com.civicpulse.grievance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, String> {

    List<Grievance> findByCitizenId(String citizenId);
    List<Grievance> findByStatus(Grievance.GrievanceStatus status);
    List<Grievance> findByAssignedDept(String dept);
    List<Grievance> findByCategory(Grievance.GrievanceCategory category);

    @Query("SELECT g FROM Grievance g WHERE " +
           "LOWER(g.title) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(g.citizenName) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(g.grievanceId) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Grievance> search(@Param("q") String q);

    long countByStatus(Grievance.GrievanceStatus status);

    List<Grievance> findBySlaDeadlineBefore(java.time.LocalDate date);
}
