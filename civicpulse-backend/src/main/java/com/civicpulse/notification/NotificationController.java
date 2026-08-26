package com.civicpulse.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public List<Notification> getAll(@RequestParam String citizenId,
                                      @RequestParam(required = false, defaultValue = "200") int limit) {
        return limit < 200
            ? service.getLatestForCitizen(citizenId, limit)
            : service.getAllForCitizen(citizenId);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@RequestParam String citizenId) {
        return Map.of("count", service.getUnreadCount(citizenId));
    }

    @PatchMapping("/{id}/read")
    public Map<String, String> markRead(@PathVariable String id) {
        service.markRead(id);
        return Map.of("status", "ok");
    }

    @PatchMapping("/read-all")
    public Map<String, String> markAllRead(@RequestParam String citizenId) {
        service.markAllRead(citizenId);
        return Map.of("status", "ok");
    }
}
