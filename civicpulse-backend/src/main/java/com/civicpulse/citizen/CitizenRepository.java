package com.civicpulse.citizen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, String> {
    Optional<Citizen> findByEmail(String email);
    Optional<Citizen> findByCitizenId(String citizenId);
    List<Citizen> findByWard(String ward);
    List<Citizen> findByStatus(Citizen.CitizenStatus status);

    @Query("SELECT c FROM Citizen c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(c.citizenId) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Citizen> search(@Param("q") String q);

    long countByStatus(Citizen.CitizenStatus status);
}
