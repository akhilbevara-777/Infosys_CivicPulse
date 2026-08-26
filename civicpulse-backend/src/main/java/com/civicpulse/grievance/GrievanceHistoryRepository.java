package com.civicpulse.grievance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GrievanceHistoryRepository extends JpaRepository<GrievanceHistory, String> {
    List<GrievanceHistory> findByGrievanceIdOrderByCreatedAtAsc(String grievanceId);
}
