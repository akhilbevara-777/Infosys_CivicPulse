package com.civicpulse.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BudgetTransactionRepository extends JpaRepository<BudgetTransaction, String> {
    List<BudgetTransaction> findByAllocationId(String allocationId);
    List<BudgetTransaction> findByDepartment(String department);
}
