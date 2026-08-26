package com.civicpulse.citizen;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "citizens")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Citizen {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String citizenId;

    @NotBlank private String name;

    @Email @NotBlank
    @Column(unique = true)
    private String email;

    private String phone;
    private String ward;

    @Column(length = 500)
    private String address;
    private String city;
    private String district;
    private String state;
    private String pincode;

    private String gender;
    private LocalDate dateOfBirth;

    @Column(length = 500)
    private String avatarUrl;

    /** Aadhaar stored as SHA-256 hash — never plain text */
    private String aadhaarHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CitizenStatus status = CitizenStatus.ACTIVE;

    private LocalDate registeredAt;
    private LocalDateTime updatedAt;

    @Builder.Default private int grievancesCount    = 0;
    @Builder.Default private int applicationsCount  = 0;

    public enum CitizenStatus { ACTIVE, INACTIVE, SUSPENDED }
}
