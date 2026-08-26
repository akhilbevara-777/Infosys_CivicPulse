package com.civicpulse.application;

import jakarta.persistence.*;
import lombok.*;

/** Single-row table used to generate sequential APP-YYYY-NNNNNN IDs */
@Entity
@Table(name = "app_id_sequence")
@Data @NoArgsConstructor @AllArgsConstructor
public class AppIdSequence {
    @Id
    private int id = 1; // always 1 — single row

    @Column(nullable = false)
    private long nextVal = 1L;
}
