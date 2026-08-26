package com.civicpulse.config;

import com.civicpulse.grievance.GrievanceRepository;
import com.civicpulse.grievance.GrievanceService;
import com.civicpulse.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final GrievanceService      grievanceService;
    private final GrievanceRepository   grievanceRepo;
    private final NotificationService   notifService;

    /**
     * Run every day at 07:00.
     * - Sends SLA warning for grievances due in 1 day.
     * - Auto-escalates breached grievances.
     */
    @Scheduled(cron = "0 0 7 * * *")
    public void runDailySLACheck() {
        log.info("Running scheduled SLA check…");

        grievanceRepo.findAll().forEach(g -> {
            if (g.getStatus() == null) return;
            switch (g.getStatus()) {
                case RESOLVED, CLOSED, REJECTED, ESCALATED -> { /* skip */ }
                default -> {
                    if (g.getSlaDeadline() == null) return;
                    long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), g.getSlaDeadline());
                    if (daysLeft == 1) {
                        // SLA warning: due tomorrow
                        notifService.grievanceSLAWarning(
                            g.getCitizenId(), g.getGrievanceId(), g.getTitle(), daysLeft);
                        log.info("  SLA warning sent for {}", g.getGrievanceId());
                    } else if (daysLeft < 0) {
                        // Already breached — notify and escalate via service
                        notifService.grievanceSLABreached(
                            g.getCitizenId(), g.getGrievanceId(), g.getTitle());
                    }
                }
            }
        });

        // Auto-escalate all breached grievances in one pass
        int escalated = grievanceService.runSLACheck();
        if (escalated > 0) log.info("  {} grievances auto-escalated by SLA check", escalated);
    }
}
