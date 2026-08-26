package com.civicpulse.welfare;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface WelAppIdSequenceRepository extends JpaRepository<WelAppIdSequence, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM WelAppIdSequence s WHERE s.id = 1")
    WelAppIdSequence findForUpdate();
}
