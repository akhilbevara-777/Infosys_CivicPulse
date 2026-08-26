package com.civicpulse.grievance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** DTO for creating a grievance — avoids exposing internal entity fields */
@Data
public class GrievanceRequest {
    @NotBlank public String citizenId;
    @NotBlank public String citizenName;
    @NotBlank public String ward;
    @NotNull  public Grievance.GrievanceCategory category;
    @NotNull  public Grievance.GrievanceSeverity severity;
    @NotBlank public String title;
    @NotBlank public String description;
    public String assignedDept;
}
