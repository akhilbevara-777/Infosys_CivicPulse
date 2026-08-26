package com.civicpulse.budget;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "budget_transactions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BudgetTransaction {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String allocationId;
    private String department;
    private long amount;
    @Enumerated(EnumType.STRING)
    private TxType type;
    @Column(length = 500) private String description;
    private String referenceId;
    private String createdAt;
    private String createdBy;

    public enum TxType { CREDIT, DEBIT }
}
