package com.civicpulse.welfare;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "wel_app_id_sequence")
@Data @NoArgsConstructor @AllArgsConstructor
public class WelAppIdSequence {
    @Id private int id = 1;
    @Column(nullable = false) private long nextVal = 1L;
}
