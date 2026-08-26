package com.civicpulse.budget;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetAllocationRepository allocRepo;
    private final BudgetTransactionRepository txRepo;

    public List<BudgetAllocation> getAllAllocations()              { return allocRepo.findAll(); }
    public List<BudgetAllocation> getByDept(String dept)           { return allocRepo.findByDepartment(dept); }
    public List<BudgetTransaction> getAllTransactions()             { return txRepo.findAll(); }
    public List<BudgetTransaction> getTxByAllocation(String id)    { return txRepo.findByAllocationId(id); }

    public BudgetAllocation createAllocation(BudgetAllocation a) {
        a.setId(null);
        a.setLastUpdated(LocalDate.now().toString());
        return allocRepo.save(a);
    }

    public BudgetTransaction recordTransaction(BudgetTransaction tx) {
        tx.setId(null);
        tx.setCreatedAt(LocalDate.now().toString());
        // Update spent on allocation
        allocRepo.findById(tx.getAllocationId()).ifPresent(alloc -> {
            if (tx.getType() == BudgetTransaction.TxType.DEBIT)
                alloc.setSpentAmount(alloc.getSpentAmount() + tx.getAmount());
            else
                alloc.setAllocatedAmount(alloc.getAllocatedAmount() + tx.getAmount());
            alloc.setLastUpdated(LocalDate.now().toString());
            allocRepo.save(alloc);
        });
        return txRepo.save(tx);
    }

    public record Stats(long totalAllocated, long totalSpent, long totalCommitted,
                        long available, int utilizationRate, long departmentCount) {}
    public Stats getStats() {
        long allocated  = allocRepo.totalAllocated();
        long spent      = allocRepo.totalSpent();
        long committed  = allocRepo.totalCommitted();
        int  util       = allocated == 0 ? 0 : (int)((spent * 100) / allocated);
        return new Stats(allocated, spent, committed, allocated - spent - committed, util,
                         allocRepo.findAll().stream().map(BudgetAllocation::getDepartment).distinct().count());
    }
}
