package com.civicpulse.welfare;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "welfare_schemes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WelfareScheme {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String category;
    @Column(length = 1000) private String description;
    @Column(length = 2000) private String eligibilityJson;  // JSON array
    private String benefits;
    @Column(length = 1000) private String documentsJson;    // JSON array
    private String applicationDeadline;
    private long budget;
    private int beneficiariesCount;

    @Enumerated(EnumType.STRING)
    @Builder.Default private SchemeStatus status = SchemeStatus.ACTIVE;
    private String department;
    private String createdAt;

    public enum SchemeStatus { ACTIVE, INACTIVE, UPCOMING }
}
