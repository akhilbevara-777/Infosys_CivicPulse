# CivicPulse Nexus — Cross-Role Integration Report

**Date:** 2026-08-26  
**Scope:** Citizen ↔ Officer ↔ Admin ↔ Commissioner role integration across Grievances, Applications, Welfare, Documents, SLA, and Notifications.

---

## Changes Made This Session

| File | Change |
|------|--------|
| `AppLayout.tsx` | Added route guards: citizens blocked from `/admin/*`, staff blocked from `/citizen/*` |
| `GrievancesPage.tsx` (admin) | Added `useEffect` load from DB on mount, officer assign, actor/role on status updates, "Request Info" → `pending_citizen`, Reject button |
| `ApplicationsPage.tsx` (admin) | Added `useEffect` load from DB on mount, refresh button |
| `WelfarePage.tsx` (admin) | Replaced local mock state with real `welfareApi` calls; live KPI stats; full disburse/reject/approve wired to backend |
| `AdminDashboard.tsx` | Removed hardcoded mock data; loads live grievances + applications from stores on mount |
| `grievanceStore.ts` | Added `assign()` action; `updateStatus` passes `actor`/`actorRole` |
| `grievanceApi.ts` | `updateStatus` passes `actor`/`actorRole` params; added `assign()` |
| `CivicPulseApplication.java` | Added `@EnableScheduling` |
| `ScheduledTasks.java` | Daily 07:00 cron: SLA warning notification (1 day left) + auto-escalate breached |

---

## WORKFLOW 1 — Grievance: Citizen → Officer → Citizen

### Flow
```
Citizen files grievance
  → POST /api/grievances  (GrievanceRequest DTO)
  → GrievanceService.create()
  → grievance saved to DB, history entry added
  → NotificationService.grievanceSubmitted() fires → DB notification

Admin/Officer sees grievance (GrievancesPage)
  → loads all from GET /api/grievances on mount
  → can filter by status / category / dept

Officer assigns themselves
  → PATCH /api/grievances/{id}/assign?officer=Name&dept=Dept
  → status → ACKNOWLEDGED/ASSIGNED
  → NotificationService.grievanceAssigned() → citizen notification

Officer marks in progress
  → PATCH /api/grievances/{id}/status?status=IN_PROGRESS&actor=Name&actorRole=OFFICER
  → history entry recorded with actor name

Officer requests more info
  → status → PENDING_CITIZEN with officerMessage
  → citizen sees amber "Action Required" banner on their grievance
  → citizen submits response → POST /api/grievances/{id}/respond

Officer resolves
  → PATCH /api/grievances/{id}/status?status=RESOLVED&resolution=...
  → NotificationService.grievanceResolved() → citizen notification
  → Citizen can Accept Resolution (→ CLOSED) or Reopen
```

### Status
| Step | Backend | Frontend (Admin) | Frontend (Citizen) | Result |
|------|---------|------------------|--------------------|--------|
| Citizen files | ✅ DB | — | ✅ POST works | **PASS** |
| Admin sees new grievance | ✅ load() on mount | ✅ loads from DB | — | **PASS** |
| Officer assigns | ✅ PATCH /assign | ✅ assign input in modal | — | **PASS** |
| Status update with actor | ✅ actor/role stored in history | ✅ passes actor name+role | — | **PASS** |
| Citizen sees update | ✅ notification in DB | — | ✅ 30s auto-refresh | **PASS** |
| Request info → pending_citizen | ✅ PENDING_CITIZEN transition | ✅ "Request Info" button | ✅ amber banner + reply form | **PASS** |
| Citizen responds | ✅ citizenId ownership check | — | ✅ textarea + submit | **PASS** |
| Officer resolves | ✅ resolution saved | ✅ "Mark Resolved" button | ✅ RESOLVED badge + accept/reopen | **PASS** |
| Citizen accepts resolution | ✅ → CLOSED | — | ✅ "Accept Resolution" button | **PASS** |

---

## WORKFLOW 2 — Service Application: Citizen → Dept → Citizen

### Flow
```
Citizen submits application with documents
  → POST /api/applications/submit (multipart)
  → ApplicationSubmitService validates form + stores files via DocumentService
  → ApplicationService.create() → DB, event recorded
  → NotificationService.applicationSubmitted() fires

Admin/Officer sees application (ApplicationsPage)
  → loads all from GET /api/applications on mount
  → filter by status, category, search

Officer assigns themselves
  → PATCH /api/applications/{id}/assign?officer=Name
  → status → UNDER_REVIEW

Officer verifies each document
  → PATCH /api/applications/{id}/verify-document?docName=...
  → document.verified = true; auto-advance to VERIFIED when all done

Officer approves
  → PATCH /api/applications/{id}/status?status=APPROVED
  → NotificationService.applicationApproved() fires

Commissioner issues certificate
  → PATCH /api/applications/{id}/status?status=ISSUED
  → certificate number, QR code, digital signature generated
  → NotificationService.certificateIssued() fires

Citizen downloads certificate
  → downloadCertificate() renders HTML with QR + digital signature
```

### Status
| Step | Backend | Frontend (Admin) | Frontend (Citizen) | Result |
|------|---------|------------------|--------------------|--------|
| Submit with docs | ✅ DocumentService, form validation | — | ✅ full multi-doc form | **PASS** |
| Admin sees application | ✅ load() on mount | ✅ table with all apps | — | **PASS** |
| Assign officer | ✅ PATCH /assign | ✅ assign input + button | — | **PASS** |
| Verify documents | ✅ per-doc verify endpoint | ✅ Verify button per doc | ✅ verified badge on citizen side | **PASS** |
| Request more docs | ✅ DOCUMENTS_PENDING + notes | ✅ transition button | ✅ orange banner shown | **PASS** |
| Approve | ✅ DB, notification | ✅ Approved button | ✅ notification + status update | **PASS** |
| Issue certificate | ✅ cert no + QR generated | ✅ Issued button | ✅ Download button appears | **PASS** |
| Download certificate | — client HTML render | ✅ admin download | ✅ citizen download | **PASS** |
| Duplicate blocked | ✅ 409 on duplicate active | — | ✅ error toast shown | **PASS** |

---

## WORKFLOW 3 — Welfare: Citizen → Officer → Notification

### Flow
```
Citizen applies for welfare scheme (multi-step)
  → eligibility check (client + server-side ✗ gate)
  → POST /api/welfare/applications/submit (multipart)
  → WelfareService.apply() checks duplicate, eligibility
  → NotificationService.welfareSubmitted() fires

Admin/Officer sees application (WelfarePage → Applications tab)
  → loads all from GET /api/welfare/applications on mount (no citizenId filter)
  → click row → Application modal

Officer verifies eligibility/documents → Approve
  → PATCH /api/welfare/applications/{id}/status?status=APPROVED
  → NotificationService.welfareApproved() fires

Officer disburses funds
  → PATCH .../status?status=DISBURSED&disbursementAmount=...&disbursementRef=...
  → NotificationService.welfareDisbursed() fires

Citizen sees status + disbursement amount
  → welfareApi.getApplications(citizenId) on welfare page load
  → disbursement details shown in "My Applications" card
```

### Status
| Step | Backend | Frontend (Admin) | Frontend (Citizen) | Result |
|------|---------|------------------|--------------------|--------|
| Citizen applies | ✅ DB, eligibility gate | — | ✅ 4-step form | **PASS** |
| Admin sees all apps | ✅ no citizenId filter | ✅ loads from API on mount | — | **PASS (fixed)** |
| Start verification | ✅ UNDER_VERIFICATION | ✅ "Start Verification" button | — | **PASS** |
| Approve | ✅ DB, notification | ✅ Approve button | ✅ status updated | **PASS** |
| Disburse with amount + ref | ✅ disbursementAmount + ref saved | ✅ amount + ref inputs | ✅ amount shown on citizen side | **PASS** |
| Reject with reason | ✅ rejectionReason saved | ✅ Reject button + notes | ✅ reason shown | **PASS** |
| Notifications fire | ✅ all status changes fire | — | ✅ bell badge updates | **PASS** |

---

## WORKFLOW 4 — Document: Citizen Upload → Officer Verify → Citizen Sees Status

### Flow
```
Citizen uploads document during service application or welfare
  → DocumentService.upload() validates MIME, extension, size, path-traversal
  → UUID filename stored server-side
  → document record in DB (no public URL)

Officer verifies document
  → PATCH /api/documents/{id}/verify?officerName=...&status=VERIFIED
  → document.verificationStatus = VERIFIED

Citizen sees verification badge
  → DocumentUploader shows VERIFIED badge when savedDocument prop present
  → Application detail shows ✓ Verified per document

Officer can request reupload
  → status = REUPLOAD_REQUIRED
  → citizen sees "Re-upload Needed" badge + replace button

Citizen replaces document
  → PUT /api/documents/{id} (replace endpoint)
  → new file stored, status reset to UPLOADED
```

### Status
| Step | Backend | Admin | Citizen | Result |
|------|---------|-------|---------|--------|
| Upload with MIME check | ✅ MIME + ext + size + path | — | ✅ client + server | **PASS** |
| Blocked executables | ✅ blocklist | — | ✅ client blocklist too | **PASS** |
| Officer verifies | ✅ PATCH /verify | ✅ Verify button per doc | ✅ badge updates | **PASS** |
| Download only by owner | ✅ findByDocumentIdAndOwnerIdentity | — | ✅ requesterId passed | **PASS** |
| Cross-citizen blocked | ✅ 403 if ownership mismatch | — | — | **PASS** |

---

## WORKFLOW 5 — SLA: Start → Warning → Breach → Escalation

### Flow
```
Grievance created
  → slaDeadline = now + SLA_DAYS[severity]
  → CRITICAL=1d, HIGH=3d, MEDIUM=7d, LOW=14d

Daily 07:00 scheduled task (ScheduledTasks.java)
  → daysLeft == 1 → NotificationService.grievanceSLAWarning() fires
  → daysLeft < 0  → NotificationService.grievanceSLABreached() fires
  → GrievanceService.runSLACheck() auto-escalates all breached → ESCALATED

Frontend
  → computeSLA() calculates slaStatus from slaDeadline on every render
  → DUE_SOON (1d) → orange badge
  → BREACHED → red badge + card border highlight
  → checkSLAEscalation() applied on every API load

Admin SLA check on demand
  → POST /api/grievances/sla-check
  → Returns count of auto-escalated grievances
```

### Status
| Step | Backend | Admin | Citizen | Result |
|------|---------|-------|---------|--------|
| SLA days set on create | ✅ SLA_DAYS map | — | ✅ badge shown | **PASS** |
| Daily warning notification | ✅ @Scheduled 07:00 | — | ✅ bell notification | **PASS (new)** |
| Breach notification | ✅ @Scheduled 07:00 | — | ✅ GRIEVANCE_SLA_BREACHED | **PASS (new)** |
| Auto-escalate on breach | ✅ runSLACheck() | ✅ ESCALATED badge | ✅ escalated status | **PASS** |
| Frontend DUE_SOON badge | — | ✅ orange | ✅ orange | **PASS** |
| Frontend BREACHED badge | — | ✅ red | ✅ red + highlighted card | **PASS** |
| Dashboard SLA alerts | — | — | ✅ SLA Alerts card | **PASS** |

---

## ROLE-BASED ACCESS CONTROL

| Endpoint / Action | CITIZEN | OFFICER | ADMIN | COMMISSIONER |
|-------------------|---------|---------|-------|-------------|
| `GET /api/grievances?citizenId=X` | ✅ own only | ✅ all | ✅ all | ✅ all |
| `GET /api/grievances/{id}?requesterId` | ✅ own (403 if other's) | ✅ no filter | ✅ no filter | ✅ no filter |
| `POST /api/grievances` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/grievances/{id}/status` | ❌ (only respond/reopen/accept) | ✅ | ✅ | ✅ |
| `GET /api/applications?citizenId=X` | ✅ own only | ✅ all | ✅ all | ✅ all |
| `GET /api/applications/{id}?requesterId` | ✅ own (403 if other's) | ✅ | ✅ | ✅ |
| `POST /api/applications/submit` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/applications/{id}/status` | ❌ (only cancel own) | ✅ | ✅ | ✅ |
| `GET /api/welfare/applications?citizenId=X` | ✅ own only | ✅ all | ✅ all | ✅ all |
| `PATCH /api/welfare/applications/{id}/status` | ❌ | ✅ | ✅ | ✅ |
| `PATCH /api/citizens/{id}/status` | ❌ | ❌ | ✅ (requesterRole check) | ✅ |
| `GET /api/documents/{id}/download?requesterId` | ✅ own only | ✅ admin override | ✅ admin override | ✅ |
| `GET /api/notifications?citizenId=X` | ✅ scoped to own | ❌ not applicable | ❌ | ❌ |
| Route `/admin/*` | ❌ redirected to `/citizen/dashboard` | ✅ | ✅ | ✅ |
| Route `/citizen/*` | ✅ | ❌ redirected to `/admin/dashboard` | ❌ | ❌ |

---

## Outstanding Items

| # | Item | Priority |
|---|------|----------|
| 1 | Password authentication uses SHA-256 client-side verification — needs Spring Security + BCrypt for production | HIGH |
| 2 | No JWT/session tokens — auth state held only in Zustand localStorage persist | HIGH |
| 3 | `GET /api/citizens/{id}` has no requester ownership check (used by admin; low risk for admin-only access) | LOW |
| 4 | Admin welfare KPI stats (utilization %) computed from disbursed/budget — accurate once DB is populated | LOW |
| 5 | DB reset required for fresh DataSeeder seed (demo citizen `citizen@civicpulse.gov` + cross-referenced data) | SETUP |

---

## Summary

All 5 cross-role workflows are now wired end-to-end through the shared PostgreSQL database:

- Admin pages load live DB data on mount (no more hardcoded mock)
- Admin welfare page makes real API calls (was entirely on mock state before)
- Admin dashboard shows live grievance/application counts from stores
- Officer assignment, status updates, and document verification all persist to DB and trigger citizen notifications
- Route guards prevent citizens from accessing admin routes and vice versa
- SLA warning and breach notifications now fire automatically via `@Scheduled` daily task
- Actor identity (officer name + role) is recorded in every grievance history entry
