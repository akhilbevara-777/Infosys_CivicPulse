package com.civicpulse.budget;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "budget_allocations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BudgetAllocation {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String department;
    private String category;
    private String fiscalYear;
    private long allocatedAmount;
    private long spentAmount;
    private long committedAmount;
    @Column(length = 500) private String description;
    private String approvedBy;
    private String approvedAt;
    private String lastUpdated;
}
