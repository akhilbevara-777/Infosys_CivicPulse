package com.civicpulse.citizen;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citizens")
@RequiredArgsConstructor
public class CitizenController {

    private final CitizenService service;

    @GetMapping
    public List<Citizen> getAll(@RequestParam(required = false) String search) {
        return (search != null && !search.isBlank()) ? service.search(search) : service.getAll();
    }

    @GetMapping("/{id}")
    public CitizenProfileDto getById(@PathVariable String id) {
        return CitizenProfileDto.from(service.getById(id));
    }

    /** Get profile by logged-in citizen's own ID (safe — strips aadhaarHash) */
    @GetMapping("/{id}/profile")
    public ResponseEntity<CitizenProfileDto> getProfile(@PathVariable String id) {
        try {
            return ResponseEntity.ok(CitizenProfileDto.from(service.getById(id)));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<CitizenProfileDto> create(@Valid @RequestBody Citizen citizen) {
        return ResponseEntity.ok(CitizenProfileDto.from(service.create(citizen)));
    }

    /** Full profile update */
    @PutMapping("/{id}/profile")
    public ResponseEntity<CitizenProfileDto> updateProfile(
            @PathVariable String id,
            @RequestBody ProfileUpdateRequest req) {
        return ResponseEntity.ok(CitizenProfileDto.from(service.updateProfile(id, req)));
    }

    /** Change password — requires current password */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable String id,
            @RequestBody PasswordChangeRequest req) {
        service.changePassword(id, req.currentPassword(), req.newPassword());
        return ResponseEntity.ok(Map.of("status", "Password changed successfully"));
    }

    /** Upload profile photo */
    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CitizenProfileDto> uploadAvatar(
            @PathVariable String id,
            @RequestParam MultipartFile file) {
        return ResponseEntity.ok(CitizenProfileDto.from(service.uploadAvatar(id, file)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id,
                                           @RequestParam Citizen.CitizenStatus status,
                                           @RequestParam(required = false) String requestedBy,
                                           @RequestParam(required = false) String requesterRole) {
        // Only admins and commissioners may change citizen status
        if (requesterRole == null || (!requesterRole.equalsIgnoreCase("ADMIN")
                                   && !requesterRole.equalsIgnoreCase("COMMISSIONER"))) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", "Insufficient permissions"));
        }
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @GetMapping("/stats")
    public CitizenService.Stats getStats() {
        return service.getStats();
    }

    /** Login — verifies email + password, returns safe profile DTO */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            java.util.Optional<Citizen> opt = service.findByEmail(req.email());
            if (opt.isEmpty()) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", "Invalid email or password"));
            }
            Citizen c = opt.get();
            if (!service.verifyPassword(c, req.password())) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", "Invalid email or password"));
            }
            return ResponseEntity.ok(CitizenProfileDto.from(c));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Invalid email or password"));
        }
    }

    public record LoginRequest(String email, String password) {}

    // ── Request / DTO records ─────────────────────────────────────────────────

    public record ProfileUpdateRequest(
        String name, String phone, String gender, String dateOfBirth,
        String address, String city, String district, String state, String pincode, String ward
    ) {}

    public record PasswordChangeRequest(String currentPassword, String newPassword) {}

    /** Safe DTO — never exposes aadhaarHash or internal fields */
    public record CitizenProfileDto(
        String id, String citizenId, String name, String email, String phone,
        String gender, String dateOfBirth, String address, String city,
        String district, String state, String pincode, String ward,
        String avatarUrl, String status, String registeredAt, String updatedAt,
        int grievancesCount, int applicationsCount
    ) {
        public static CitizenProfileDto from(Citizen c) {
            return new CitizenProfileDto(
                c.getId(), c.getCitizenId(), c.getName(), c.getEmail(), c.getPhone(),
                c.getGender(),
                c.getDateOfBirth() != null ? c.getDateOfBirth().toString() : null,
                c.getAddress(), c.getCity(), c.getDistrict(), c.getState(), c.getPincode(), c.getWard(),
                c.getAvatarUrl(),
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getRegisteredAt() != null ? c.getRegisteredAt().toString() : null,
                c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null,
                c.getGrievancesCount(), c.getApplicationsCount()
            );
        }
    }
}
