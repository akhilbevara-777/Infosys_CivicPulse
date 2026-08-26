package com.civicpulse.budget;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService service;

    @GetMapping("/allocations")
    public List<BudgetAllocation> getAllocations(@RequestParam(required = false) String dept) {
        return dept != null ? service.getByDept(dept) : service.getAllAllocations();
    }

    @PostMapping("/allocations")
    public ResponseEntity<BudgetAllocation> createAllocation(@RequestBody BudgetAllocation alloc) {
        return ResponseEntity.ok(service.createAllocation(alloc));
    }

    @GetMapping("/transactions")
    public List<BudgetTransaction> getTransactions(@RequestParam(required = false) String allocationId) {
        return allocationId != null ? service.getTxByAllocation(allocationId) : service.getAllTransactions();
    }

    @PostMapping("/transactions")
    public ResponseEntity<BudgetTransaction> recordTransaction(@RequestBody BudgetTransaction tx) {
        return ResponseEntity.ok(service.recordTransaction(tx));
    }

    @GetMapping("/stats")
    public BudgetService.Stats getStats() {
        return service.getStats();
    }
}
