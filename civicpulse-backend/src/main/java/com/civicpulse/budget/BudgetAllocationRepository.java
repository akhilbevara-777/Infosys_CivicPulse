package com.civicpulse.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BudgetAllocationRepository extends JpaRepository<BudgetAllocation, String> {
    List<BudgetAllocation> findByDepartment(String department);
    List<BudgetAllocation> findByFiscalYear(String fiscalYear);

    @Query("SELECT COALESCE(SUM(b.allocatedAmount),0) FROM BudgetAllocation b")
    long totalAllocated();

    @Query("SELECT COALESCE(SUM(b.spentAmount),0) FROM BudgetAllocation b")
    long totalSpent();

    @Query("SELECT COALESCE(SUM(b.committedAmount),0) FROM BudgetAllocation b")
    long totalCommitted();
}
