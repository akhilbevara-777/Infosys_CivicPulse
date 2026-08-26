package com.civicpulse.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationEventRepository extends JpaRepository<ApplicationEvent, String> {
    List<ApplicationEvent> findByApplicationIdOrderByCreatedAtAsc(String applicationId);
}
