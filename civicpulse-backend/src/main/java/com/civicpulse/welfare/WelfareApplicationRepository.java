package com.civicpulse.welfare;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WelfareApplicationRepository extends JpaRepository<WelfareApplication, String> {
    List<WelfareApplication> findByCitizenId(String citizenId);
    List<WelfareApplication> findBySchemeId(String schemeId);
    List<WelfareApplication> findByStatus(WelfareApplication.WelfareStatus status);
    long countByStatus(WelfareApplication.WelfareStatus status);

    @Query("SELECT COALESCE(SUM(a.disbursementAmount), 0) FROM WelfareApplication a WHERE a.status = 'DISBURSED'")
    Double totalDisbursed();
}
