# CivicPulse Nexus — Spring Boot Backend

Java 21 · Spring Boot 3.2 · H2 (dev) / PostgreSQL (prod)

## Quick Start (no Maven install needed)

```cmd
cd civicpulse-backend
mvnw.cmd spring-boot:run
```

Backend starts on **http://localhost:8080**  
H2 console available at **http://localhost:8080/h2-console** (JDBC URL: `jdbc:h2:mem:civicpulsedb`)

## REST API Endpoints

| Service | Base Path | Key endpoints |
|---------|-----------|---------------|
| Citizen | `/api/citizens` | GET, POST, PATCH `/{id}/status`, GET `/stats` |
| Grievance | `/api/grievances` | GET, POST, PATCH `/{id}/status`, POST `/{id}/escalate`, PATCH `/{id}/assign` |
| Application | `/api/applications` | GET, POST, PATCH `/{id}/status`, PATCH `/{id}/verify-document`, PATCH `/{id}/fee-paid` |
| Welfare | `/api/welfare/schemes`, `/api/welfare/applications` | GET, POST, PATCH |
| Budget | `/api/budget/allocations`, `/api/budget/transactions` | GET, POST |
| Reports | `/api/reports/governance` | Single KPI dashboard endpoint |

## Switch to PostgreSQL

1. Uncomment the PostgreSQL section in `src/main/resources/application.properties`
2. Comment out the H2 section
3. Create database: `createdb civicpulse`
4. Restart the backend

## Data

On first startup, `DataSeeder` automatically seeds all mock data (8 citizens, 6 grievances,  
6 applications, 5 welfare schemes, 4 welfare applications, 8 budget allocations).  
Re-seeding is skipped if data already exists.
