package com.civicpulse.welfare;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WelfareSchemeRepository extends JpaRepository<WelfareScheme, String> {
    List<WelfareScheme> findByStatus(WelfareScheme.SchemeStatus status);
    List<WelfareScheme> findByCategory(String category);
    long countByStatus(WelfareScheme.SchemeStatus status);
}
