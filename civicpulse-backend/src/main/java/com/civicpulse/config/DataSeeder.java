package com.civicpulse.config;

import com.civicpulse.application.*;
import com.civicpulse.budget.*;
import com.civicpulse.citizen.*;
import com.civicpulse.grievance.*;
import com.civicpulse.welfare.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CitizenRepository            citizenRepo;
    private final GrievanceRepository          grievanceRepo;
    private final ApplicationRepository        applicationRepo;
    private final AppIdSequenceRepository      seqRepo;
    private final WelfareSchemeRepository      welfareSchemeRepo;
    private final WelfareApplicationRepository welfareAppRepo;
    private final WelAppIdSequenceRepository   welSeqRepo;
    private final BudgetAllocationRepository   budgetRepo;
    private final BudgetTransactionRepository  txRepo;

    @Override
    public void run(String... args) {
        if (citizenRepo.count() > 0) { log.info("DB already seeded — skipping."); return; }
        log.info("Seeding CivicPulse database...");

        // Seed citizens first, capture real UUIDs
        Map<String, String> cidMap = seedCitizens();

        seedGrievances(cidMap);
        seedApplications(cidMap);

        Map<String, String> schemeIds = seedWelfareSchemes();
        seedWelfareApplications(cidMap, schemeIds);

        seedBudget();

        if (seqRepo.count() == 0) seqRepo.save(new AppIdSequence(1, 100L));
        if (welSeqRepo.count() == 0) welSeqRepo.save(new WelAppIdSequence(1, 10L));
        log.info("Seeding complete.");
    }

    // ─── Citizens ─────────────────────────────────────────────────────────────
    /** Returns map: email → real UUID assigned by JPA */
    private Map<String, String> seedCitizens() {
        List<Citizen> saved = citizenRepo.saveAll(List.of(
            citizen("CTZ-2024-0001","Ramesh Kumar",  "citizen@civicpulse.gov","9876543210","Ward 12","14, Gandhi Nagar, Sector 5","Chennai","Chennai","Tamil Nadu","600001"),
            citizen("CTZ-2024-1247","Ramesh Kumar",  "ramesh@email.com", "9876543210","Ward 12","14, Gandhi Nagar","Chennai","Chennai","Tamil Nadu","600001"),
            citizen("CTZ-2024-1248","Priya Sharma",  "priya@email.com",  "9876543211","Ward 7", "22, Nehru Street","Chennai","Chennai","Tamil Nadu","600002"),
            citizen("CTZ-2024-1249","Arjun Mehta",   "arjun@email.com",  "9876543212","Ward 3", "8, MG Road","Chennai","Chennai","Tamil Nadu","600003"),
            citizen("CTZ-2024-1250","Sunita Reddy",  "sunita@email.com", "9876543213","Ward 15","5, Lake View Colony","Chennai","Chennai","Tamil Nadu","600015"),
            citizen("CTZ-2024-1251","Vijay Nair",    "vijay@email.com",  "9876543214","Ward 9", "31, Old Town","Chennai","Chennai","Tamil Nadu","600009"),
            citizen("CTZ-2024-1252","Deepa Krishnan","deepa@email.com",  "9876543215","Ward 5", "17, Park Avenue","Chennai","Chennai","Tamil Nadu","600005"),
            citizen("CTZ-2024-1253","Rahul Joshi",   "rahul@email.com",  "9876543216","Ward 11","9, Shivaji Nagar","Chennai","Chennai","Tamil Nadu","600011"),
            citizen("CTZ-2024-1254","Meena Pillai",  "meena@email.com",  "9876543217","Ward 18","43, South Street","Chennai","Chennai","Tamil Nadu","600018")
        ));
        Map<String, String> m = new HashMap<>();
        saved.forEach(c -> m.put(c.getEmail(), c.getId()));
        log.info("  ✓ Citizens seeded (9 records, real UUIDs resolved)");
        return m;
    }

    private Citizen citizen(String cId, String name, String email,
                             String phone, String ward, String addr,
                             String city, String district, String state, String pincode) {
        return Citizen.builder().citizenId(cId).name(name).email(email)
            .phone(phone).ward(ward).address(addr)
            .city(city).district(district).state(state).pincode(pincode)
            .status(Citizen.CitizenStatus.ACTIVE)
            .registeredAt(LocalDate.of(2024, 1, 15))
            .updatedAt(LocalDateTime.of(2024, 1, 15, 0, 0))
            .build();
    }

    // ─── Grievances ──────────────────────────────────────────────────────────
    private void seedGrievances(Map<String, String> cid) {
        String demo   = cid.getOrDefault("citizen@civicpulse.gov", "unknown");
        String ramesh = cid.getOrDefault("ramesh@email.com", "unknown");
        String priya  = cid.getOrDefault("priya@email.com",  "unknown");
        String arjun  = cid.getOrDefault("arjun@email.com",  "unknown");
        String sunita = cid.getOrDefault("sunita@email.com", "unknown");
        String deepa  = cid.getOrDefault("deepa@email.com",  "unknown");
        String rahul  = cid.getOrDefault("rahul@email.com",  "unknown");

        grievanceRepo.saveAll(List.of(
            Grievance.builder()
                .grievanceId("GRV-2026-001").citizenId(demo).citizenName("Ramesh Kumar").ward("Ward 12")
                .category(Grievance.GrievanceCategory.WATER_SUPPLY).severity(Grievance.GrievanceSeverity.HIGH)
                .title("No water supply for 3 days").description("Water supply cut off for 3 days in Sector 5.")
                .status(Grievance.GrievanceStatus.IN_PROGRESS).assignedDept("Water Department")
                .assignedOfficer("Officer Priya Singh").slaDeadline(LocalDate.now().plusDays(2)).slaDays(3)
                .escalationLevel(1).escalatedAt(LocalDateTime.now().minusDays(1)).escalationReason("SLA approaching")
                .createdAt(LocalDateTime.now().minusDays(5)).updatedAt(LocalDateTime.now().minusDays(1)).build(),

            Grievance.builder()
                .grievanceId("GRV-2026-002").citizenId(demo).citizenName("Ramesh Kumar").ward("Ward 12")
                .category(Grievance.GrievanceCategory.ROAD_MAINTENANCE).severity(Grievance.GrievanceSeverity.MEDIUM)
                .title("Pothole on main road causing accidents").description("Large pothole near bus stop, two accidents already.")
                .status(Grievance.GrievanceStatus.SUBMITTED).assignedDept("Road & Infrastructure")
                .slaDeadline(LocalDate.now().plusDays(5)).slaDays(7)
                .createdAt(LocalDateTime.now().minusDays(2)).updatedAt(LocalDateTime.now().minusDays(2)).build(),

            Grievance.builder()
                .grievanceId("GRV-2026-003").citizenId(demo).citizenName("Ramesh Kumar").ward("Ward 12")
                .category(Grievance.GrievanceCategory.ELECTRICITY).severity(Grievance.GrievanceSeverity.LOW)
                .title("Street light not working on Gandhi Nagar").description("Street light at Gandhi Nagar Sec 5 non-functional for 10 days.")
                .status(Grievance.GrievanceStatus.RESOLVED).assignedDept("Electricity Board")
                .slaDeadline(LocalDate.now().minusDays(3)).slaDays(14)
                .resolution("Street light repaired and tested.").resolvedAt(LocalDateTime.now().minusDays(3))
                .createdAt(LocalDateTime.now().minusDays(14)).updatedAt(LocalDateTime.now().minusDays(3)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-847").citizenId(ramesh).citizenName("Ramesh Kumar").ward("Ward 12")
                .category(Grievance.GrievanceCategory.WATER_SUPPLY).severity(Grievance.GrievanceSeverity.HIGH)
                .title("No water supply for 3 days").description("Water supply cut off for 3 days in Sector 5.")
                .status(Grievance.GrievanceStatus.IN_PROGRESS).assignedDept("Water Department")
                .assignedOfficer("Officer Priya Singh").slaDeadline(LocalDate.of(2026,8,12)).slaDays(2)
                .escalationLevel(1).escalatedAt(LocalDateTime.of(2026,8,10,10,0)).escalationReason("SLA approaching")
                .createdAt(LocalDateTime.of(2026,8,8,9,0)).updatedAt(LocalDateTime.of(2026,8,9,10,0)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-848").citizenId(priya).citizenName("Priya Sharma").ward("Ward 7")
                .category(Grievance.GrievanceCategory.ROAD_MAINTENANCE).severity(Grievance.GrievanceSeverity.MEDIUM)
                .title("Pothole causing accidents").description("Large pothole on Main Street near bus stop.")
                .status(Grievance.GrievanceStatus.SUBMITTED).assignedDept("Road & Infrastructure")
                .slaDeadline(LocalDate.of(2026,8,15)).slaDays(5)
                .createdAt(LocalDateTime.of(2026,8,7,8,0)).updatedAt(LocalDateTime.of(2026,8,7,8,0)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-849").citizenId(arjun).citizenName("Arjun Mehta").ward("Ward 3")
                .category(Grievance.GrievanceCategory.ELECTRICITY).severity(Grievance.GrievanceSeverity.CRITICAL)
                .title("Power outage entire block").description("Complete power failure in Block C for 2 days.")
                .status(Grievance.GrievanceStatus.ESCALATED).assignedDept("Electricity Board")
                .slaDeadline(LocalDate.of(2026,8,9)).slaDays(1)
                .escalationLevel(2).escalatedAt(LocalDateTime.of(2026,8,9,9,0)).escalationReason("Critical — hospital affected")
                .createdAt(LocalDateTime.of(2026,8,7,8,0)).updatedAt(LocalDateTime.of(2026,8,9,9,0)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-850").citizenId(sunita).citizenName("Sunita Reddy").ward("Ward 15")
                .category(Grievance.GrievanceCategory.SANITATION).severity(Grievance.GrievanceSeverity.HIGH)
                .title("Garbage not collected for a week").description("Waste accumulation on street corners.")
                .status(Grievance.GrievanceStatus.RESOLVED).assignedDept("Sanitation Dept")
                .slaDeadline(LocalDate.of(2026,8,5)).slaDays(3)
                .resolution("Garbage collected. Daily schedule restored.")
                .resolvedAt(LocalDateTime.of(2026,8,4,16,0))
                .createdAt(LocalDateTime.of(2026,7,28,9,0)).updatedAt(LocalDateTime.of(2026,8,4,16,0)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-851").citizenId(deepa).citizenName("Deepa Krishnan").ward("Ward 5")
                .category(Grievance.GrievanceCategory.PUBLIC_SAFETY).severity(Grievance.GrievanceSeverity.MEDIUM)
                .title("Street lights not working").description("8 street lights on Park Avenue non-functional.")
                .status(Grievance.GrievanceStatus.IN_PROGRESS).assignedDept("Electricity Board")
                .slaDeadline(LocalDate.of(2026,8,14)).slaDays(4)
                .createdAt(LocalDateTime.of(2026,8,6,10,0)).updatedAt(LocalDateTime.of(2026,8,8,14,0)).build(),

            Grievance.builder()
                .grievanceId("GRV-2024-852").citizenId(rahul).citizenName("Rahul Joshi").ward("Ward 11")
                .category(Grievance.GrievanceCategory.WATER_SUPPLY).severity(Grievance.GrievanceSeverity.LOW)
                .title("Low water pressure").description("Inadequate water pressure in morning hours.")
                .status(Grievance.GrievanceStatus.SUBMITTED).assignedDept("Water Department")
                .slaDeadline(LocalDate.of(2026,8,18)).slaDays(7)
                .createdAt(LocalDateTime.of(2026,8,8,8,0)).updatedAt(LocalDateTime.of(2026,8,8,8,0)).build()
        ));
        log.info("  ✓ Grievances seeded");
    }

    // ─── Applications ────────────────────────────────────────────────────────
    private void seedApplications(Map<String, String> cid) {
        String demo   = cid.getOrDefault("citizen@civicpulse.gov", "unknown");
        String ramesh = cid.getOrDefault("ramesh@email.com", "unknown");
        String priya  = cid.getOrDefault("priya@email.com",  "unknown");
        String arjun  = cid.getOrDefault("arjun@email.com",  "unknown");
        String sunita = cid.getOrDefault("sunita@email.com", "unknown");
        String deepa  = cid.getOrDefault("deepa@email.com",  "unknown");
        String meena  = cid.getOrDefault("meena@email.com",  "unknown");

        applicationRepo.saveAll(List.of(
            // Demo citizen applications
            ServiceApplication.builder()
                .appId("APP-2026-000001").citizenId(demo).citizenName("Ramesh Kumar")
                .type("Income Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.UNDER_REVIEW).fee(30).feePaid(true)
                .documentsJson("[{\"name\":\"Salary Slip\",\"verified\":true},{\"name\":\"Bank Statement\",\"verified\":false}]")
                .submittedAt(LocalDate.now().minusDays(5)).assignedOfficer("Officer Priya Singh")
                .expectedCompletionDate(LocalDate.now().plusDays(2))
                .updatedAt(LocalDateTime.now().minusDays(3)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2026-000002").citizenId(demo).citizenName("Ramesh Kumar")
                .type("Residence Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.ISSUED).fee(30).feePaid(true)
                .documentsJson("[{\"name\":\"Utility Bill\",\"verified\":true},{\"name\":\"Aadhaar Card\",\"verified\":true}]")
                .submittedAt(LocalDate.now().minusDays(20)).approvedAt(LocalDate.now().minusDays(15)).issuedAt(LocalDate.now().minusDays(15))
                .certificateNo("RC-2026-000002").signedBy("Commissioner Mehta").signatureId("SIG-D002")
                .verificationCode("RCDEM002").qrCode("CIVICPULSE:VERIFY:RC-2026-000002:RAMESH_KUMAR")
                .updatedAt(LocalDateTime.now().minusDays(15)).downloadCount(2).build(),

            // Other citizens
            ServiceApplication.builder()
                .appId("APP-2024-1247").citizenId(priya).citizenName("Priya Sharma")
                .type("Birth Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.ISSUED).fee(50).feePaid(true)
                .documentsJson("[{\"name\":\"Hospital Record\",\"verified\":true},{\"name\":\"Aadhaar Card\",\"verified\":true}]")
                .submittedAt(LocalDate.of(2026,8,1)).approvedAt(LocalDate.of(2026,8,3)).issuedAt(LocalDate.of(2026,8,3))
                .certificateNo("BC-2024-1247").assignedOfficer("Officer Priya Singh")
                .signedBy("Commissioner Mehta").signatureId("SIG-001").verificationCode("ABC12345")
                .qrCode("CIVICPULSE:VERIFY:BC-2024-1247:PRIYA_SHARMA")
                .updatedAt(LocalDateTime.of(2026,8,3,12,0)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2024-1248").citizenId(ramesh).citizenName("Ramesh Kumar")
                .type("Income Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.UNDER_REVIEW).fee(30).feePaid(true)
                .documentsJson("[{\"name\":\"Salary Slip\",\"verified\":true},{\"name\":\"Bank Statement\",\"verified\":false}]")
                .submittedAt(LocalDate.of(2026,8,5)).assignedOfficer("Officer Priya Singh")
                .updatedAt(LocalDateTime.of(2026,8,5,10,0)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2024-1249").citizenId(sunita).citizenName("Sunita Reddy")
                .type("Trade License").category(ServiceApplication.AppCategory.PERMIT)
                .status(ServiceApplication.AppStatus.DOCUMENTS_PENDING).fee(200).feePaid(true)
                .documentsJson("[{\"name\":\"Business Registration\",\"verified\":true},{\"name\":\"NOC from Fire Dept\",\"verified\":false}]")
                .submittedAt(LocalDate.of(2026,8,3)).notes("Awaiting NOC from Fire Department")
                .updatedAt(LocalDateTime.of(2026,8,3,11,0)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2024-1250").citizenId(arjun).citizenName("Arjun Mehta")
                .type("Residence Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.ISSUED).fee(30).feePaid(true)
                .documentsJson("[{\"name\":\"Utility Bill\",\"verified\":true},{\"name\":\"Aadhaar Card\",\"verified\":true}]")
                .submittedAt(LocalDate.of(2026,7,28)).approvedAt(LocalDate.of(2026,7,30)).issuedAt(LocalDate.of(2026,7,30))
                .certificateNo("RC-2024-1250").signedBy("Commissioner Mehta").signatureId("SIG-002")
                .verificationCode("DEF67890").qrCode("CIVICPULSE:VERIFY:RC-2024-1250:ARJUN_MEHTA")
                .updatedAt(LocalDateTime.of(2026,7,30,15,0)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2024-1251").citizenId(deepa).citizenName("Deepa Krishnan")
                .type("Building Permit").category(ServiceApplication.AppCategory.PERMIT)
                .status(ServiceApplication.AppStatus.SUBMITTED).fee(500).feePaid(false)
                .documentsJson("[{\"name\":\"Site Plan\",\"verified\":false},{\"name\":\"Property Documents\",\"verified\":false}]")
                .submittedAt(LocalDate.of(2026,8,8))
                .updatedAt(LocalDateTime.of(2026,8,8,9,0)).downloadCount(0).build(),

            ServiceApplication.builder()
                .appId("APP-2024-1252").citizenId(meena).citizenName("Meena Pillai")
                .type("Death Certificate").category(ServiceApplication.AppCategory.CERTIFICATE)
                .status(ServiceApplication.AppStatus.ISSUED).fee(50).feePaid(true)
                .documentsJson("[{\"name\":\"Hospital Death Record\",\"verified\":true},{\"name\":\"Aadhaar Card\",\"verified\":true}]")
                .submittedAt(LocalDate.of(2026,8,6)).approvedAt(LocalDate.of(2026,8,7)).issuedAt(LocalDate.of(2026,8,7))
                .certificateNo("DC-2024-1252").signedBy("Commissioner Mehta").signatureId("SIG-003")
                .verificationCode("GHI11223").qrCode("CIVICPULSE:VERIFY:DC-2024-1252:MEENA_PILLAI")
                .updatedAt(LocalDateTime.of(2026,8,7,14,0)).downloadCount(0).build()
        ));
        log.info("  ✓ Applications seeded");
    }

    // ─── Welfare Schemes ──────────────────────────────────────────────────────
    /** Returns map: shortKey → real UUID */
    private Map<String, String> seedWelfareSchemes() {
        List<WelfareScheme> saved = welfareSchemeRepo.saveAll(List.of(
            WelfareScheme.builder().name("Pradhan Mantri Awas Yojana (Urban)").category("Housing")
                .description("Affordable housing for urban poor families")
                .eligibilityJson("[\"Annual income < ₹3L\",\"No pucca house\",\"Indian citizen\"]")
                .benefits("Subsidy up to ₹2.67 lakh on home loans")
                .documentsJson("[\"Aadhaar Card\",\"Income Certificate\",\"Bank Details\"]")
                .budget(50000000).beneficiariesCount(2847).status(WelfareScheme.SchemeStatus.ACTIVE)
                .department("Municipal Administration").createdAt("2024-01-01").build(),

            WelfareScheme.builder().name("Free Education Scholarship").category("Education")
                .description("Full scholarship for meritorious BPL students")
                .eligibilityJson("[\"BPL family\",\"Age 6-18 years\",\"Govt school enrolled\"]")
                .benefits("₹5000/year + free textbooks").documentsJson("[\"Aadhaar Card\",\"BPL Card\"]")
                .budget(15000000).beneficiariesCount(3450).status(WelfareScheme.SchemeStatus.ACTIVE)
                .department("Education Dept").createdAt("2024-01-01").build(),

            WelfareScheme.builder().name("Old Age Pension Scheme").category("Senior Citizen")
                .description("Monthly pension for destitute elderly citizens")
                .eligibilityJson("[\"Age 60+ years\",\"Annual income < ₹1L\"]")
                .benefits("₹1000/month pension").documentsJson("[\"Aadhaar Card\",\"Age Proof\"]")
                .budget(24000000).beneficiariesCount(2000).status(WelfareScheme.SchemeStatus.ACTIVE)
                .department("Public Health").createdAt("2024-01-01").build(),

            WelfareScheme.builder().name("Disability Support Allowance").category("Disability")
                .description("Monthly financial aid for persons with disabilities")
                .eligibilityJson("[\"Disability certificate (40%+)\",\"Annual income < ₹2L\"]")
                .benefits("₹1500/month + free bus pass").documentsJson("[\"Aadhaar Card\",\"Disability Certificate\"]")
                .budget(6000000).beneficiariesCount(400).status(WelfareScheme.SchemeStatus.ACTIVE)
                .department("Municipal Administration").createdAt("2024-01-01").build(),

            WelfareScheme.builder().name("Skill Development & Employment").category("Employment")
                .description("Free vocational training and job placement")
                .eligibilityJson("[\"Age 18-35 years\",\"Unemployed\",\"10th pass\"]")
                .benefits("Free training + ₹2500 stipend").documentsJson("[\"Aadhaar Card\",\"Educational Certificates\"]")
                .applicationDeadline("2026-09-30")
                .budget(12000000).beneficiariesCount(650).status(WelfareScheme.SchemeStatus.ACTIVE)
                .department("Municipal Administration").createdAt("2024-01-01").build()
        ));
        Map<String, String> m = new HashMap<>();
        String[] keys = {"PMAY", "Education", "Pension", "Disability", "Employment"};
        for (int i = 0; i < saved.size() && i < keys.length; i++) m.put(keys[i], saved.get(i).getId());
        log.info("  ✓ Welfare schemes seeded");
        return m;
    }

    // ─── Welfare Applications ────────────────────────────────────────────────
    private void seedWelfareApplications(Map<String, String> cid, Map<String, String> sid) {
        String demo   = cid.getOrDefault("citizen@civicpulse.gov", "unknown");
        String ramesh  = cid.getOrDefault("ramesh@email.com", "unknown");
        String sunita  = cid.getOrDefault("sunita@email.com", "unknown");
        String deepa   = cid.getOrDefault("deepa@email.com",  "unknown");
        String rahul   = cid.getOrDefault("rahul@email.com",  "unknown");

        String pmayId  = sid.getOrDefault("PMAY",       "ws1");
        String eduId   = sid.getOrDefault("Education",  "ws2");
        String penId   = sid.getOrDefault("Pension",    "ws3");
        String disId   = sid.getOrDefault("Disability", "ws4");
        String empId   = sid.getOrDefault("Employment", "ws5");

        welfareAppRepo.saveAll(List.of(
            WelfareApplication.builder().appId("WEL-2026-000001").schemeId(pmayId)
                .schemeName("Pradhan Mantri Awas Yojana (Urban)").citizenId(demo)
                .citizenName("Ramesh Kumar").ward("Ward 12")
                .status(WelfareApplication.WelfareStatus.DISBURSED)
                .submittedAt(LocalDate.now().minusDays(60)).approvedAt(LocalDate.now().minusDays(40))
                .disbursedAt(LocalDate.now().minusDays(20)).disbursementAmount(267000.0)
                .updatedAt(LocalDateTime.now().minusDays(20)).build(),

            WelfareApplication.builder().appId("WEL-2026-000002").schemeId(empId)
                .schemeName("Skill Development & Employment").citizenId(demo)
                .citizenName("Ramesh Kumar").ward("Ward 12")
                .status(WelfareApplication.WelfareStatus.UNDER_VERIFICATION)
                .submittedAt(LocalDate.now().minusDays(10))
                .updatedAt(LocalDateTime.now().minusDays(8)).build(),

            WelfareApplication.builder().appId("WEL-2024-001").schemeId(pmayId)
                .schemeName("Pradhan Mantri Awas Yojana (Urban)").citizenId(ramesh)
                .citizenName("Ramesh Kumar").ward("Ward 12")
                .status(WelfareApplication.WelfareStatus.DISBURSED)
                .submittedAt(LocalDate.of(2026,7,1)).approvedAt(LocalDate.of(2026,7,20))
                .disbursedAt(LocalDate.of(2026,8,1)).disbursementAmount(267000.0)
                .updatedAt(LocalDateTime.of(2026,8,1,12,0)).build(),

            WelfareApplication.builder().appId("WEL-2024-002").schemeId(penId)
                .schemeName("Old Age Pension Scheme").citizenId(sunita)
                .citizenName("Sunita Reddy").ward("Ward 15")
                .status(WelfareApplication.WelfareStatus.UNDER_VERIFICATION)
                .submittedAt(LocalDate.of(2026,8,1)).updatedAt(LocalDateTime.of(2026,8,1,10,0)).build(),

            WelfareApplication.builder().appId("WEL-2024-003").schemeId(eduId)
                .schemeName("Free Education Scholarship").citizenId(deepa)
                .citizenName("Deepa Krishnan").ward("Ward 5")
                .status(WelfareApplication.WelfareStatus.SUBMITTED)
                .submittedAt(LocalDate.of(2026,8,5)).updatedAt(LocalDateTime.of(2026,8,5,9,0)).build(),

            WelfareApplication.builder().appId("WEL-2024-004").schemeId(disId)
                .schemeName("Disability Support Allowance").citizenId(rahul)
                .citizenName("Rahul Joshi").ward("Ward 11")
                .status(WelfareApplication.WelfareStatus.REJECTED)
                .submittedAt(LocalDate.of(2026,7,15)).notes("Disability certificate below 40%")
                .updatedAt(LocalDateTime.of(2026,7,20,11,0)).build()
        ));
        log.info("  ✓ Welfare applications seeded");
    }

    // ─── Budget ───────────────────────────────────────────────────────────────
    private void seedBudget() {
        budgetRepo.saveAll(List.of(
            b("Road & Infrastructure","Infrastructure",50000000,32500000,8000000,"Road repairs and new construction"),
            b("Water Department","Infrastructure",35000000,18200000,5000000,"Pipeline upgrades and pump maintenance"),
            b("Public Health","Healthcare",20000000,11500000,3000000,"Healthcare camps and medicine procurement"),
            b("Education Dept","Education",25000000,14000000,4000000,"School infrastructure and scholarships"),
            b("Municipal Administration","Welfare",30000000,22000000,2000000,"Welfare disbursements and housing subsidies"),
            b("Sanitation Dept","Maintenance",15000000,9800000,1500000,"Garbage vehicles and waste treatment"),
            b("Electricity Board","Infrastructure",28000000,15000000,6000000,"Street lighting and transformer upgrades"),
            b("All Departments","Emergency",10000000,1200000,0,"Emergency response fund")
        ));
        txRepo.saveAll(List.of(
            t("Road & Infrastructure",5000000, BudgetTransaction.TxType.DEBIT,"Phase 1 road repair contract",null,"2026-05-15"),
            t("Water Department",3200000,     BudgetTransaction.TxType.DEBIT,"Pipeline replacement Ward 5-12",null,"2026-06-01"),
            t("Municipal Administration",267000,BudgetTransaction.TxType.DEBIT,"PMAY disbursement",null,"2026-08-01"),
            t("Public Health",2000000,         BudgetTransaction.TxType.DEBIT,"Mobile health clinic procurement",null,"2026-07-10"),
            t("Electricity Board",1500000,      BudgetTransaction.TxType.DEBIT,"LED streetlight replacement Phase 2",null,"2026-07-20")
        ));
        log.info("  ✓ Budget seeded");
    }

    private BudgetAllocation b(String dept, String cat, long alloc, long spent, long committed, String desc) {
        return BudgetAllocation.builder().department(dept).category(cat).fiscalYear("2026-27")
            .allocatedAmount(alloc).spentAmount(spent).committedAmount(committed)
            .description(desc).approvedBy("Commissioner Mehta")
            .approvedAt("2026-04-01").lastUpdated("2026-08-09").build();
    }

    private BudgetTransaction t(String dept, long amt, BudgetTransaction.TxType type,
                                  String desc, String ref, String date) {
        // allocationId is resolved lazily — for dev/seed purposes use dept name reference
        return BudgetTransaction.builder().allocationId("seeded").department(dept)
            .amount(amt).type(type).description(desc).referenceId(ref)
            .createdAt(date).createdBy("Admin Sharma").build();
    }
}
