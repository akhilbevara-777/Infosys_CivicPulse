package com.civicpulse.citizen;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CitizenService {

    private final CitizenRepository repo;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_IMG = Set.of("image/jpeg","image/jpg","image/png","image/webp");

    // ─── Helpers ──────────────────────────────────────────────────────────────
    /** SHA-256 hash for password storage (use BCrypt in production) */
    private String hash(String plain) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(plain.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { throw new RuntimeException("Hash error", e); }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────
    public List<Citizen> getAll()           { return repo.findAll(); }
    public Citizen getById(String id)       { return repo.findById(id).orElseThrow(() -> new RuntimeException("Citizen not found: " + id)); }
    public List<Citizen> search(String q)   { return repo.search(q); }
    public java.util.Optional<Citizen> findByEmail(String email) { return repo.findByEmail(email); }

    @Transactional
    public Citizen create(Citizen c) {
        if (repo.findByEmail(c.getEmail()).isPresent()) throw new RuntimeException("Email already registered");
        c.setId(null);
        c.setCitizenId("CTZ-" + LocalDate.now().getYear() + "-" + (1000 + (int)(Math.random() * 9000)));
        c.setRegisteredAt(LocalDate.now());
        c.setUpdatedAt(LocalDateTime.now());
        // Hash and store the password if provided
        if (c.getAadhaarHash() != null && !c.getAadhaarHash().isBlank()
                && !c.getAadhaarHash().startsWith("PWD:")) {
            // aadhaarHash field is reused to carry the plain password from signup request
            c.setAadhaarHash("PWD:" + hash(c.getAadhaarHash()));
        }
        return repo.save(c);
    }

    /**
     * Verify a plain-text password against the stored hash.
     * Returns true if the password matches, or if no password is set (legacy seeded data).
     */
    public boolean verifyPassword(Citizen c, String plain) {
        if (c.getAadhaarHash() == null || !c.getAadhaarHash().startsWith("PWD:")) {
            // No password stored — deny login (forces re-registration or admin reset)
            return false;
        }
        return c.getAadhaarHash().substring(4).equals(hash(plain));
    }

    @Transactional
    public Citizen updateStatus(String id, Citizen.CitizenStatus status) {
        Citizen c = getById(id);
        c.setStatus(status);
        c.setUpdatedAt(LocalDateTime.now());
        return repo.save(c);
    }

    /** Full profile update — citizen updates own record */
    @Transactional
    public Citizen updateProfile(String id, CitizenController.ProfileUpdateRequest req) {
        Citizen c = getById(id);

        // Validate phone format
        if (req.phone() != null && !req.phone().isBlank()) {
            if (!req.phone().matches("^[6-9]\\d{9}$"))
                throw new RuntimeException("Invalid phone number format");
            c.setPhone(req.phone());
        }
        // Validate pincode
        if (req.pincode() != null && !req.pincode().isBlank()) {
            if (!req.pincode().matches("^[1-9][0-9]{5}$"))
                throw new RuntimeException("Invalid pincode format");
            c.setPincode(req.pincode());
        }

        if (req.name()        != null && !req.name().isBlank())    c.setName(req.name().trim());
        if (req.gender()      != null)                              c.setGender(req.gender());
        if (req.dateOfBirth() != null && !req.dateOfBirth().isBlank()) {
            try { c.setDateOfBirth(LocalDate.parse(req.dateOfBirth())); }
            catch (Exception e) { throw new RuntimeException("Invalid date of birth format"); }
        }
        if (req.address()  != null) c.setAddress(req.address().trim());
        if (req.city()     != null) c.setCity(req.city().trim());
        if (req.district() != null) c.setDistrict(req.district().trim());
        if (req.state()    != null) c.setState(req.state().trim());
        if (req.ward()     != null) c.setWard(req.ward().trim());

        c.setUpdatedAt(LocalDateTime.now());
        return repo.save(c);
    }

    /** Change password with current password verification */
    @Transactional
    public void changePassword(String id, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8)
            throw new RuntimeException("New password must be at least 8 characters");
        if (!newPassword.matches(".*[A-Z].*") || !newPassword.matches(".*[0-9].*"))
            throw new RuntimeException("Password must contain at least one uppercase letter and one digit");

        Citizen c = getById(id);
        // Verify current password against stored hash
        String currentHash = hash(currentPassword);
        if (c.getAadhaarHash() != null && c.getAadhaarHash().startsWith("PWD:")) {
            String storedHash = c.getAadhaarHash().substring(4);
            if (!storedHash.equals(currentHash))
                throw new RuntimeException("Current password is incorrect");
        }
        // Store new password (prefixed to distinguish from aadhaar hash)
        c.setAadhaarHash("PWD:" + hash(newPassword));
        c.setUpdatedAt(LocalDateTime.now());
        repo.save(c);
    }

    /** Upload and store profile avatar */
    @Transactional
    public Citizen uploadAvatar(String id, MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("File is empty");
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_IMG.contains(ct.toLowerCase()))
            throw new RuntimeException("Invalid file type. Allowed: JPG, PNG, WebP");
        if (file.getSize() > 2 * 1024 * 1024)
            throw new RuntimeException("Avatar must be under 2MB");

        String ext  = Optional.ofNullable(file.getOriginalFilename())
            .filter(f -> f.contains(".")).map(f -> f.substring(f.lastIndexOf('.'))).orElse(".jpg");
        String name = "avatar_" + id + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get(uploadDir, "avatars");
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(name).toFile());
        } catch (IOException e) { throw new RuntimeException("Upload failed: " + e.getMessage()); }

        Citizen c = getById(id);
        c.setAvatarUrl("/uploads/avatars/" + name);
        c.setUpdatedAt(LocalDateTime.now());
        return repo.save(c);
    }

    public record Stats(long total, long active, long inactive, long suspended) {}
    public Stats getStats() {
        return new Stats(
            repo.count(),
            repo.countByStatus(Citizen.CitizenStatus.ACTIVE),
            repo.countByStatus(Citizen.CitizenStatus.INACTIVE),
            repo.countByStatus(Citizen.CitizenStatus.SUSPENDED)
        );
    }
}
