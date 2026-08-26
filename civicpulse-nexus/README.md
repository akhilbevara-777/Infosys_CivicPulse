# CivicPulse Nexus — Frontend

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Recharts

## Run

```cmd
cd civicpulse-nexus
npm install
npm run dev
```

Opens at **http://localhost:5173**

## Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@civicpulse.gov | citizen123 |
| Admin | admin@civicpulse.gov | admin123 |
| Officer | officer@civicpulse.gov | officer123 |
| Commissioner | commissioner@civicpulse.gov | comm123 |

## Backend Integration

The frontend works fully **without** the backend (uses mock data automatically).  
To connect to the real Spring Boot backend:

1. Start the backend: `cd civicpulse-backend && mvnw.cmd spring-boot:run`
2. The frontend will automatically call `http://localhost:8080` (set in `.env`)
3. All API calls fall back to mock data if backend is offline — no errors

## Milestones Implemented

| Milestone | Features |
|-----------|----------|
| M1 | Citizen registration, Grievance management, SLA escalation, Department assignment |
| M2 | Certificate & Permit applications, Approval workflow, Digital signing, Certificate download |
| M3 | Welfare schemes, Beneficiary management, Fund disbursement, Budget tracking |
