package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.notification.NotificationService;
import com.gmao.gmao_backend.notification.NotificationType;
import com.gmao.gmao_backend.task.Task;
import com.gmao.gmao_backend.task.TaskAssignedTo;
import com.gmao.gmao_backend.task.TaskRepository;
import com.gmao.gmao_backend.task.TaskSparePart;
import com.gmao.gmao_backend.task.TaskStatus;

import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Génère une tâche de travail réelle pour chaque plan de maintenance arrivé
 * à échéance. Le mécanisme existant
 * (MaintenancePlanService#ensureDueOccurrences) ne fait que cloner le
 * *plan* pour préparer sa prochaine occurrence — il ne crée jamais de
 * tâche. Chaque ligne MaintenancePlan représentant déjà exactement une
 * occurrence (via ce clonage), la dé-duplication se fait simplement en
 * vérifiant qu'aucune tâche n'est encore liée à ce plan.
 */
@Service
@RequiredArgsConstructor
public class MaintenancePlanTaskGenerationService {

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final MaintenancePlanService maintenancePlanService;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void generateDueTasks() {
        maintenancePlanRepository.findAll()
                .stream()
                .map(plan -> plan.getEquipment().getUsine().getId())
                .distinct()
                .forEach(maintenancePlanService::ensureDueOccurrencesForUsine);

        LocalDate today = LocalDate.now();

        List<MaintenancePlan> duePlans = maintenancePlanRepository.findAll()
                .stream()
                .filter(plan -> plan.getTriggerType() == MaintenanceTriggerType.FIXED_DATE)
                .filter(plan -> plan.getNextDueDate() != null && !plan.getNextDueDate().isAfter(today))
                .filter(plan -> plan.getStatus() == MaintenancePlanStatus.PLANNED
                        || plan.getStatus() == MaintenancePlanStatus.LATE)
                .filter(plan -> !taskRepository.existsByMaintenancePlanId(plan.getId()))
                .toList();

        for (MaintenancePlan plan : duePlans) {
            generateTaskForPlan(plan);
        }
    }

    private void generateTaskForPlan(MaintenancePlan plan) {
        LocalDate dueDate = plan.getNextDueDate();

        Task task = Task.builder()
                .equipmentOnly(plan.isEquipmentOnly())
                .equipment(plan.getEquipment())
                .description(plan.getDescription())
                .allDay(true)
                .startDate(dueDate)
                .endDate(dueDate)
                .plannedMaintenanceHours(plan.getPlannedMaintenanceHours())
                .plannedMaintenanceMinutes(plan.getPlannedMaintenanceMinutes())
                .plannedStoppedHours(plan.getPlannedStoppedHours())
                .plannedStoppedMinutes(plan.getPlannedStoppedMinutes())
                .status(TaskStatus.PLANNED)
                .maintenancePlan(plan)
                .build();

        Set<TaskAssignedTo> assignedTo = new LinkedHashSet<>();
        for (MaintenancePlanAssignee assignee : plan.getAssignees()) {
            assignedTo.add(
                    TaskAssignedTo.builder()
                            .task(task)
                            .user(assignee.getUser())
                            .team(assignee.getTeam())
                            .build()
            );
        }
        task.setAssignedTo(assignedTo);

        Set<TaskSparePart> spareParts = new LinkedHashSet<>();
        for (MaintenancePlanSparePart line : plan.getSpareParts()) {
            spareParts.add(
                    TaskSparePart.builder()
                            .task(task)
                            .sparePart(line.getSparePart())
                            .quantity(line.getQuantity())
                            .build()
            );
        }
        task.setSpareParts(spareParts);

        Task savedTask = taskRepository.save(task);

        notifyAssignedUsers(savedTask);
    }

    /**
     * Prévient chaque utilisateur directement affecté (hors équipes) qu'une
     * tâche vient d'être générée automatiquement pour lui.
     */
    private void notifyAssignedUsers(Task task) {
        task.getAssignedTo()
                .stream()
                .map(TaskAssignedTo::getUser)
                .filter(Objects::nonNull)
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.TASK_ASSIGNED,
                        "Tâche générée depuis un plan de maintenance",
                        task.getDescription(),
                        "/tasks/" + task.getId()
                ));
    }
}
