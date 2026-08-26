package com.civicpulse.application;

import com.civicpulse.document.Document;
import com.civicpulse.document.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationSubmitService {

    private final ApplicationService applicationService;
    private final DocumentService    documentService;

    // Required form fields per service type
    private static final Map<String, List<String>> REQUIRED_FIELDS = Map.ofEntries(
        Map.entry("Birth Certificate",     List.of("childName", "dateOfBirth", "placeOfBirth", "fatherName", "motherName")),
        Map.entry("Death Certificate",     List.of("deceasedName", "dateOfDeath", "placeOfDeath", "causeOfDeath")),
        Map.entry("Income Certificate",    List.of("applicantName", "annualIncome", "occupation", "familyMembers")),
        Map.entry("Residence Certificate", List.of("applicantName", "residenceAddress", "yearsOfResidence")),
        Map.entry("Marriage Certificate",  List.of("groomName", "brideName", "marriageDate", "marriagePlace", "witnessName")),
        Map.entry("Caste Certificate",     List.of("applicantName", "casteName", "fatherName", "religion")),
        Map.entry("Trade License",         List.of("businessName", "businessAddress", "tradeType", "ownerName", "contactPhone")),
        Map.entry("Building Permit",       List.of("ownerName", "propertyAddress", "plotArea", "constructionType", "purpose")),
        Map.entry("Food License",          List.of("businessName", "businessAddress", "ownerName", "foodCategory", "contactPhone")),
        Map.entry("Event Permit",          List.of("organizerName", "eventName", "eventDate", "venueName", "expectedAttendees")),
        Map.entry("Signage Permit",        List.of("applicantName", "signageAddress", "signageType", "dimensions"))
    );

    // Required documents per service type
    static final Map<String, List<String>> REQUIRED_DOCS = Map.ofEntries(
        Map.entry("Birth Certificate",     List.of("Hospital Record", "Aadhaar Card", "Parent ID")),
        Map.entry("Death Certificate",     List.of("Hospital Death Record", "Aadhaar Card")),
        Map.entry("Income Certificate",    List.of("Salary Slip", "Bank Statement", "Aadhaar Card")),
        Map.entry("Residence Certificate", List.of("Utility Bill", "Aadhaar Card", "Landlord Declaration")),
        Map.entry("Marriage Certificate",  List.of("Marriage Photos", "Aadhaar Cards (both)", "Witness IDs")),
        Map.entry("Caste Certificate",     List.of("Aadhaar Card", "Parent Caste Certificate", "School Records")),
        Map.entry("Trade License",         List.of("Business Registration", "NOC from Fire Dept", "Aadhaar Card")),
        Map.entry("Building Permit",       List.of("Site Plan", "Property Documents", "Structural Certificate")),
        Map.entry("Food License",          List.of("Identity Proof", "Premises Proof", "NOC")),
        Map.entry("Event Permit",          List.of("Event Details", "Venue Proof", "Police NOC")),
        Map.entry("Signage Permit",        List.of("Signage Design", "Location Photos", "Owner Consent"))
    );

    @Transactional
    public ServiceApplication submit(String citizenId, String citizenName, String type,
                                      String category, String formDataJson,
                                      Map<String, MultipartFile> files) {

        // 1. Validate service type
        if (!REQUIRED_DOCS.containsKey(type))
            throw new RuntimeException("Unknown service type: " + type);

        // 2. Validate required form fields
        validateFormData(type, formDataJson);

        // 3. Store files via DocumentService (secure, validates type/size/path)
        List<String> requiredDocs = REQUIRED_DOCS.getOrDefault(type, List.of());
        List<Map<String, Object>> docList = new ArrayList<>();
        for (String docName : requiredDocs) {
            MultipartFile file = (files != null) ? files.get(docName) : null;
            if (file == null || file.isEmpty())
                throw new RuntimeException("Required document missing: " + docName);

            // Delegate to DocumentService — all security validations happen there
            Document stored = documentService.upload(file, citizenId, docName,
                null, Document.EntityType.APPLICATION); // entityId set after app creation

            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("name",         docName);
            doc.put("verified",     false);
            doc.put("documentId",   stored.getDocumentId());  // reference for secure download
            doc.put("fileName",     stored.getOriginalFileName());
            doc.put("fileSize",     stored.getFileSize());
            doc.put("uploadedAt",   LocalDate.now().toString());
            docList.add(doc);
        }

        // 4. Build app entity
        String docsJson = toJson(docList);

        ServiceApplication app = ServiceApplication.builder()
            .citizenId(citizenId)
            .citizenName(citizenName)
            .type(type)
            .category("certificate".equalsIgnoreCase(category)
                ? ServiceApplication.AppCategory.CERTIFICATE
                : ServiceApplication.AppCategory.PERMIT)
            .documentsJson(docsJson)
            .formDataJson(formDataJson)
            .build();

        return applicationService.create(app);
    }

    private void validateFormData(String type, String formDataJson) {
        if (formDataJson == null || formDataJson.isBlank())
            throw new RuntimeException("Form data is required");
        List<String> required = REQUIRED_FIELDS.getOrDefault(type, List.of());
        for (String field : required) {
            String pattern = "\"" + field + "\":\"";
            int idx = formDataJson.indexOf(pattern);
            if (idx == -1 || formDataJson.charAt(idx + pattern.length()) == '"')
                throw new RuntimeException("Required field missing or empty: " + field);
        }
    }

    /** Minimal JSON serializer for List<Map> — avoids Jackson dependency issues */
    private String toJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("{");
            Map<String, Object> m = list.get(i);
            boolean first = true;
            for (Map.Entry<String, Object> e : m.entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(e.getKey()).append("\":");
                Object v = e.getValue();
                if (v instanceof Boolean || v instanceof Number) sb.append(v);
                else sb.append("\"").append(String.valueOf(v).replace("\"", "\\\"")).append("\"");
                first = false;
            }
            sb.append("}");
        }
        return sb.append("]").toString();
    }
}
