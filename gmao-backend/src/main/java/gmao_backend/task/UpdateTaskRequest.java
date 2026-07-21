package com.gmao.gmao_backend.task;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

public record UpdateTaskRequest(

        boolean equipmentOnly,

        @NotNull(message = "L'équipement est obligatoire.")
        Long equipmentId,

        @NotBlank(message = "La description de la tâche est obligatoire.")
        @Size(max = 3000, message = "La description ne doit pas dépasser 3000 caractères.")
        String description,

        boolean allDay,

        @NotNull(message = "La date de début est obligatoire.")
        LocalDate startDate,

        LocalTime startHour,

        @NotNull(message = "La date de fin est obligatoire.")
        LocalDate endDate,

        LocalTime endHour,

        @Min(value = 0, message = "Les heures ne peuvent pas être négatives.")
        int plannedMaintenanceHours,

        @Min(value = 0, message = "Les minutes doivent être comprises entre 0 et 59.")
        @Max(value = 59, message = "Les minutes doivent être comprises entre 0 et 59.")
        int plannedMaintenanceMinutes,

        @Min(value = 0, message = "Les heures ne peuvent pas être négatives.")
        int plannedStoppedHours,

        @Min(value = 0, message = "Les minutes doivent être comprises entre 0 et 59.")
        @Max(value = 59, message = "Les minutes doivent être comprises entre 0 et 59.")
        int plannedStoppedMinutes,

        @NotNull(message = "Le statut est obligatoire.")
        TaskStatus status,

        Set<AssigneeRequest> assignees,

        Set<AssigneeRequest> assignedTo,

        Set<Long> tagIds,

        Set<TaskSparePartRequest> spareParts,

        Set<TaskLinkRequest> links,

        Set<Long> removeDocumentIds

) {

    @AssertTrue(message = "L'heure de début et l'heure de fin sont obligatoires lorsque la tâche n'est pas sur toute la journée.")
    public boolean isHoursValidWhenNotAllDay() {
        if (allDay) {
            return true;
        }

        return startHour != null && endHour != null;
    }
}
