# CivicPulse Nexus — Complete Technical Audit
**Date:** 2026-08-12 | **Scope:** Full codebase — Frontend + Backend + API Layer

---

## 1. CURRENT ARCHITECTURE

```
civicpulse-nexus/  (React 19 + TypeScript + Vite + Tailwind v4 + Zustand)
├── src/api/           axios wrappers — client.ts, citizenApi, grievanceApi,
│                      applicationApi, welfareApi, budgetApi, reportingApi
├── src/store/         Zustand: authStore, grievanceStore, applicationStore, citizenStore
├── src/services/      Mock helpers: applicationService, grievanceService,
│                      welfareService, budgetService, workflowService
├── src/pages/citizen/ CitizenDashboard, CitizenGrievancesPage, CitizenServicesPage,
│                      CitizenApplicationsPage, CitizenWelfarePage, NotificationsPage
├── src/pages/admin/   AdminDashboard, CitizensPage, GrievancesPage, ServicesPage,
│                      ApplicationsPage, WelfarePage, BudgetPage, AssetsPage, ReportsPage
├── src/data/mockData.ts  Fallback seed data
└── src/types/index.ts    All TypeScript interfaces

civicpulse-backend/  (Spring Boot 3.2 + Java 21 + PostgreSQL)
├── citizen/     Citizen entity, CitizenController, CitizenService, CitizenRepository
├── grievance/   Grievance entity, GrievanceController, GrievanceService, GrievanceRepository
├── application/ ServiceApplication, ApplicationController, ApplicationService, ApplicationRepository
├── welfare/     WelfareScheme, WelfareApplication, controllers, services, repos
├── budget/      BudgetAllocation, BudgetTransaction, controllers, services, repos
├── reporting/   ReportingController (aggregates all stats)
└── config/      CorsConfig, GlobalExceptionHandler, DataSeeder
```

---

## 2. EXISTING REST API ENDPOINTS

### `/api/citizens`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/citizens` | List all / `?search=` |
| GET | `/api/citizens/{id}` | Get by ID |
| POST | `/api/citizens` | Create citizen |
| PATCH | `/api/citizens/{id}/status` | Update status |
| GET | `/api/citizens/stats` | Counts by status |

### `/api/grievances`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/grievances` | List / `?citizenId=` / `?search=` |
| POST | `/api/grievances` | Create grievance |
| PATCH | `/api/grievances/{id}/status` | Update status + resolution |
| POST | `/api/grievances/{id}/escalate` | Escalate with reason |
| PATCH | `/api/grievances/{id}/assign` | Assign officer |
| GET | `/api/grievances/stats` | Aggregate counts |

### `/api/applications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/applications` | List / `?citizenId=` / `?search=` |
| POST | `/api/applications` | Create application |
| PATCH | `/api/applications/{id}/status` | Workflow transition |
| PATCH | `/api/applications/{id}/verify-document` | Mark doc verified |
| PATCH | `/api/applications/{id}/fee-paid` | Mark fee paid |
| PATCH | `/api/applications/{id}/assign` | Assign officer |
| POST | `/api/applications/{id}/download` | Track download count |
| GET | `/api/applications/stats` | Aggregate counts |

### `/api/welfare`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/welfare/schemes` | List / `?category=` |
| GET | `/api/welfare/schemes/{id}` | Get scheme |
| GET | `/api/welfare/applications` | List / `?citizenId=` |
| POST | `/api/welfare/applications` | Apply for scheme |
| PATCH | `/api/welfare/applications/{id}/status` | Update / disburse |
| GET | `/api/welfare/stats` | Aggregate stats |

### `/api/budget`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/budget/allocations` | List / `?dept=` |
| POST | `/api/budget/allocations` | Create allocation |
| GET | `/api/budget/transactions` | List / `?allocationId=` |
| POST | `/api/budget/transactions` | Record transaction |
| GET | `/api/budget/stats` | Totals + utilization |

### `/api/reports`
| Method | Path |
|--------|------|
| GET | `/api/reports/governance` — all KPIs |
| GET | `/api/reports/citizens` |
| GET | `/api/reports/grievances` |
| GET | `/api/reports/applications` |
| GET | `/api/reports/budget` |
| GET | `/api/reports/welfare` |

---

## 3. EXISTING DATABASE MODELS

| Table | Key Fields |
|-------|-----------|
| `citizens` | id(UUID), citizenId, name, email, phone, ward, address, aadhaar, status(Enum), registeredAt |
| `grievances` | id(UUID), grievanceId, citizenId, category(Enum), severity(Enum), status(Enum), assignedDept, slaDeadline, escalationLevel, resolution |
| `service_applications` | id(UUID), appId, citizenId, type, category(Enum), status(Enum), documentsJson(TEXT), fee, feePaid, certificateNo, signedBy, downloadCount |
| `welfare_schemes` | id(UUID), name, category, eligibilityJson(TEXT), documentsJson(TEXT), budget, beneficiariesCount, status(Enum) |
| `welfare_applications` | id(UUID), appId, schemeId, citizenId, status(Enum), disbursementAmount |
| `budget_allocations` | id(UUID), department, category, allocatedAmount, spentAmount, committedAmount |
| `budget_transactions` | id(UUID), allocationId, amount, type(Enum CREDIT/DEBIT) |

---

## A. Features Already Fully Implemented

- Login / 3-step Signup with role-based redirect
- Citizen Dashboard — stats, quick apply, grievance/application lists, profile
- Grievance filing form with client validation + SLA auto-escalation logic
- Grievance detail modal with status, escalation, resolution display
- Service catalogue (11 services, 3 category tabs, info modal)
- Application progress tracker (step bar, status, download)
- Certificate download (HTML print page with digital signature + QR)
- Application workflow state machine (WORKFLOW_TRANSITIONS)
- Welfare scheme browse + category filter
- Dynamic notification generation from store state
- Sidebar live badge counts (from Zustand stores)
- All 9 Admin pages fully functional (UI only)
- Spring Boot REST API — all 6 service packages
- PostgreSQL persistence — all entities, DataSeeder seeds on boot

---

## B. Features Implemented Only in Frontend (no backend call)

| Feature | File | Issue |
|---------|------|-------|
| Welfare application submit | `CitizenWelfarePage.tsx:onApply` | Local `setMyApps`, never calls `welfareApi` |
| Notification read/unread | `NotificationsPage.tsx` | Local `Set<string>`, lost on refresh |
| Asset maintenance scheduling | `AssetsPage.tsx` | Local state only |
| WorkflowService instances | `workflowService.ts` | In-memory `Map`, not persisted |

---

## C. Features Using Mock / Static Data

| Feature | Source | Issue |
|---------|--------|-------|
| Welfare schemes on citizen page | `WELFARE_SCHEMES` in `welfareService.ts` | Never calls API |
| Welfare my-apps on citizen page | `WELFARE_APPLICATIONS.filter(a => a.citizenId === 'c1')` | Hardcoded ID |
| Budget allocations | `BUDGET_ALLOCATIONS` in `budgetService.ts` | Never calls API |
| Dashboard charts | `GRIEVANCE_TREND`, `CERT_TREND` in `mockData.ts` | Static, not from DB |
| Department list in grievance form | `DEPARTMENTS` from `mockData.ts` | Not from `/api/departments` |

---

## D. Features Whose Backend Is Missing

| Feature | Missing |
|---------|---------|
| File / document upload | No `/api/uploads` endpoint, no storage config |
| Payment gateway | No `/api/payments` endpoint |
| Email notifications | No SMTP / email service |
| Push / real-time notifications | No WebSocket or SSE |
| Citizen profile update | No `PUT /api/citizens/{id}` |
| Password change | No `/api/auth/change-password` |
| Real JWT authentication | No `/api/auth/login` returning token |
| Welfare eligibility pre-check | No `/api/welfare/eligibility-check` |
| Application cancellation | No `DELETE /api/applications/{id}` |

---

## E. Features Whose Database Persistence Is Missing

| Feature | Gap |
|---------|-----|
| Document files | `documentsJson` stores name+verified only — no file path/URL |
| Notification read state | No `notifications` table |
| Payments | No `payments` table |
| Application audit trail | No `application_events` table |
| Grievance comments/timeline | No `grievance_comments` table |
| Citizen avatar | No `avatarUrl` field |
| Session / JWT tokens | Auth is localStorage only |
| Aadhaar (security) | Stored plain text — should store hash |

---

## F. Buttons That Currently Do Nothing

| Button | Location | Behavior |
|--------|----------|----------|
| `Upload →` (each required document) | `CitizenServicesPage` apply modal | Static `<span>`, no click handler |
| [Verify] [Disburse] [Report] in M3 dashboard | `WelfarePage.tsx` | `toast.success()` only |
| [Export Report] | `BudgetPage.tsx`, `WelfarePage.tsx` | `toast.success()` only |
| Edit citizen (pencil icon) | `CitizensPage.tsx` | Empty handler |

---

## G. Forms That Can Submit Incomplete / Unvalidated Data

| Form | Issue |
|------|-------|
| CitizenServicesPage — Apply | No documents uploaded; submit allowed immediately |
| CitizenServicesPage — Apply | Fee payment not verified before submission |
| CitizenWelfarePage — Apply | Zero document collection |
| CitizenWelfarePage — Apply | Eligibility criteria never checked |
| AdminServicesPage — New Application | `citizenId` is optional; creates orphan records |
| CitizenGrievancesPage — New Grievance | `assignedDept` from form not passed to `grievanceApi.create` |

---

## H. Missing Validation

| Location | Missing |
|----------|---------|
| All forms | No server-side re-validation (mock fallback bypasses backend) |
| Grievance title/description | No max length, no XSS sanitization |
| Aadhaar field | No Verhoeff checksum |
| Phone numbers | Client regex only |
| Certificate validity | No check that `validUntil` hasn't expired |
| Duplicate applications | Welfare: `alreadyApplied()` checks local mock only |
| File upload | No file type/size validation (no file input exists) |

---

## I. Missing Document Upload Functionality

**Current state** — `CitizenServicesPage` apply modal:
```tsx
<span className="text-xs text-slate-500">Upload →</span>  {/* No click handler */}
```

**What's needed:**
- `<input type="file" accept=".pdf,.jpg,.png">` per document
- File size validation (≤5MB)
- Upload progress indicator
- `POST /api/uploads` backend endpoint
- File storage (S3 / local `/uploads`)
- Document URL stored in `document_uploads` table
- Block "Submit Application" until all docs uploaded
- Admin can view/download uploaded files

---

## J. Missing Application Tracking

- No application timeline / audit log
- No officer comments visible to citizen
- No estimated completion date
- No application cancellation
- No SMS/email on status change

---

## K. Missing SLA Tracking

- SLA breach notifications not generated (logic exists, output doesn't)
- Citizen sees deadline date only — no countdown
- No SLA breach history stored in DB
- No automatic email to officer/admin on SLA breach

---

## L. Missing Notification Integration

- Read state not persisted (lost on page refresh)
- No `notifications` table
- No real-time push (manual refresh required)
- No email/SMS delivery
- No notification preferences for citizen

---

## M. Missing Citizen Profile Functionality

- Profile edit (name, phone, address) — display only
- No profile photo
- No password change endpoint
- No account deactivation
- No KYC re-verification flow

---

## N. Missing Error / Loading / Empty States

| Location | Missing |
|----------|---------|
| `CitizenDashboard` | No loading skeleton |
| All citizen pages | `error` state set in stores but never rendered |
| Network failures | User sees no feedback if API fails with non-offline error |
| `CitizenWelfarePage` | No loading state |
| Empty welfare applications | No CTA to browse schemes |

---

## O. Security Issues

| Issue | Severity |
|-------|----------|
| DB password in source code (`application.properties`) | CRITICAL |
| Authentication is fake — matches mock array only | HIGH |
| No JWT tokens — localStorage auth only | HIGH |
| No RBAC enforcement in frontend routes | HIGH |
| No input sanitization (XSS possible) | HIGH |
| Aadhaar stored plain text in DB | HIGH |
| No CSRF protection | MEDIUM |
| No rate limiting on form submissions | MEDIUM |
| No HTTPS configured | MEDIUM |

---

## P. Data Synchronization Issues

| Issue | Impact |
|-------|--------|
| `CitizenWelfarePage` uses hardcoded `citizenId === 'c1'` | All users see Ramesh Kumar's welfare apps |
| `applicationStore` initialized with ALL mock data | Citizen sees other citizens' applications until `loadByCitizen` resolves |
| Each citizen page calls `loadByCitizen` independently | Stale data, duplicate API calls |
| Admin status updates not reflected in citizen store | Citizen must refresh after admin action |
| `NotificationsPage` rebuilds every render | Notification counts flicker |

---

## 4. MISSING APIs

| API | Method | Path |
|-----|--------|------|
| File upload | POST | `/api/uploads` |
| File download | GET | `/api/uploads/{id}` |
| Real auth login | POST | `/api/auth/login` |
| Real auth signup | POST | `/api/auth/signup` |
| Logout | POST | `/api/auth/logout` |
| Change password | POST | `/api/auth/change-password` |
| Update citizen profile | PUT | `/api/citizens/{id}` |
| Notifications list | GET | `/api/notifications?citizenId=` |
| Mark notification read | PATCH | `/api/notifications/{id}/read` |
| Mark all read | POST | `/api/notifications/read-all` |
| Payment create | POST | `/api/payments` |
| Payment status | GET | `/api/payments/{id}` |
| Welfare eligibility check | POST | `/api/welfare/eligibility-check` |
| Application cancel | DELETE | `/api/applications/{id}` |
| Grievance comments | GET/POST | `/api/grievances/{id}/comments` |

---

## 5. MISSING DATABASE ENTITIES / FIELDS

### New tables needed:
```sql
document_uploads(id, application_id, document_name, file_url, file_size,
                 mime_type, uploaded_by, uploaded_at, verified, verified_by)

notifications(id, citizen_id, type, title, message, reference_id,
              reference_type, read, created_at)

payments(id, application_id, citizen_id, amount, status,
         gateway_ref, created_at, completed_at)

application_events(id, application_id, event_type, from_status,
                   to_status, actor, notes, created_at)
```

### Missing fields on existing entities:
```
Citizen:          + avatarUrl, + dateOfBirth, + aadhaar_hash (remove plain aadhaar)
ServiceApplication: + paymentId FK, + cancelledAt, + cancelReason
Grievance:        + attachmentUrls (JSON), + citizenRating, + citizenFeedback
WelfareApplication: + eligibilityVerified, + bankAccountNo (masked), + ifscCode
```

---

## 6. PRIORITY ORDER FOR IMPLEMENTATION

### P0 — Critical Bugs (fix immediately, no UI change)
1. Fix hardcoded `citizenId === 'c1'` in `CitizenWelfarePage` → use `user.id`
2. Fix `applicationStore` initial state → start empty, not all-mock-data
3. Move DB password to environment variable
4. Render `error` state from stores in all citizen pages

### P1 — Core Functionality
5. Real JWT authentication (`/api/auth/login`, token in axios headers)
6. Document upload (file inputs → `/api/uploads` → block submit until done)
7. Persist notification read state (`notifications` table + API)
8. Input sanitization (DOMPurify on all text fields)

### P2 — Feature Completeness
9. Welfare eligibility validation (backend endpoint + frontend pre-check)
10. Payment flow (fee payment before submission)
11. Citizen profile edit (`PUT /api/citizens/{id}`)
12. Application cancellation

### P3 — Polish
13. Loading skeletons (replace text "Loading…")
14. Real-time sync (WebSocket or polling)
15. Email notifications on status change
16. SLA countdown timer (days/hours remaining)

---

## 7. RECOMMENDED IMPLEMENTATION PHASES

| Phase | Work | Estimated Days |
|-------|------|----------------|
| 1 — Fix Critical Bugs | Items P0 above | 1–2 days |
| 2 — Real Auth | JWT login/signup, route guards | 2–3 days |
| 3 — Document Upload | File inputs, `/api/uploads`, block submit | 3–4 days |
| 4 — Welfare Fixes | Eligibility check, document collection | 2 days |
| 5 — Persistent Notifications | `notifications` table + API + frontend | 2 days |
| 6 — Profile & Account | Profile edit, password change | 1–2 days |
| 7 — Payment Integration | Razorpay test, `payments` table | 3–5 days |
| 8 — Real-time & Polish | Skeletons, WebSocket, email, SLA countdown | 2–3 days |

**Total estimated effort: ~17–24 days for full production readiness**

---

## SUMMARY SCORECARD

| Category | Score | Notes |
|----------|-------|-------|
| Frontend UI completeness | 9/10 | Excellent — all pages built |
| Backend API completeness | 7/10 | All core endpoints exist |
| Frontend-Backend integration | 3/10 | Mock fallback masks real calls |
| Form validation | 4/10 | Client-side only |
| Document upload | 0/10 | Not implemented |
| Authentication | 2/10 | Fake / no JWT |
| Security | 2/10 | Multiple critical gaps |
| Error handling | 3/10 | Set in stores, never rendered |
| Data synchronization | 4/10 | Several stale-data bugs |
| Notification system | 5/10 | Works but not persisted |
| **Overall** | **4/10** | Solid foundation, needs integration |
