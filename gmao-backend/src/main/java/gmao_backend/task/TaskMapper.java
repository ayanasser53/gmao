package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.activity.Activity;
import com.gmao.gmao_backend.activity.ActivityResponse;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        return toResponse(task, resolveDisplayStatus(task));
    }

    public TaskResponse toOperatorResponse(Task task) {
        return toResponse(task, resolveDisplayStatus(task));
    }

    private TaskResponse toResponse(Task task, TaskStatus status) {
        Equipment equipment = task.getEquipment();

        return new TaskResponse(

                task.getId(),

                task.isEquipmentOnly(),

                toEquipmentResponse(equipment),

                task.getDescription(),

                task.isAllDay(),

                task.getStartDate(),

                task.getStartHour(),

                task.getEndDate(),

                task.getEndHour(),

                task.getPlannedMaintenanceHours(),

                task.getPlannedMaintenanceMinutes(),

                task.getPlannedStoppedHours(),

                task.getPlannedStoppedMinutes(),

                equipment != null && equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getId()
                        : null,

                equipment != null && equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getName()
                        : null,

                status,

                mapAssignees(task.getAssignees()),

                mapAssignedTo(task.getAssignedTo()),

                mapTags(task.getTags()),

                mapSpareParts(task.getSpareParts()),

                mapDocuments(task.getDocuments()),

                task.getCreatedAt(),

                task.getUpdatedAt(),

                mapActivities(task.getActivities())
        );
    }

    public TaskListItemResponse toListItemResponse(Task task) {
        return toListItemResponse(task, resolveDisplayStatus(task));
    }

    public TaskListItemResponse toOperatorListItemResponse(Task task) {
        return toListItemResponse(task, resolveDisplayStatus(task));
    }

    private TaskListItemResponse toListItemResponse(Task task, TaskStatus status) {
        Equipment equipment = task.getEquipment();

        return new TaskListItemResponse(

                task.getId(),

                task.getDescription(),

                task.getStartDate(),

                task.getStartHour(),

                task.getEndDate(),

                task.getEndHour(),

                task.getPlannedMaintenanceHours(),

                task.getPlannedMaintenanceMinutes(),

                toEquipmentResponse(equipment),

                equipment != null && equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getId()
                        : null,

                equipment != null && equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getName()
                        : null,

                mapAssignees(task.getAssignees()),

                mapAssignedTo(task.getAssignedTo()),

                mapTags(task.getTags()),

                status
        );
    }

    /**
     * Les statuts "Creee" (tache signalee par un operateur/prestataire, pas
     * encore planifiee), "Terminee" et "Annulee" sont toujours affiches
     * tels quels. Pour les autres, le statut affiche est calcule a la
     * volee a chaque lecture :
     * - si l'echeance (date/heure de fin) est depassee : "En retard" ;
     * - sinon, si la tache comporte au moins une activite : "En cours" ;
     * - sinon : "Planifiee" (une tache planifiee/assignee par l'admin
     *   ne passe "En cours" que lorsqu'une activite y est enregistree,
     *   pas simplement parce que sa date de debut est arrivee).
     */
    private TaskStatus resolveDisplayStatus(Task task) {
        if (task.getStatus() == TaskStatus.CREATED
                || task.getStatus() == TaskStatus.DONE
                || task.getStatus() == TaskStatus.CANCELED) {
            return task.getStatus();
        }

        LocalTime endTime = task.isAllDay() || task.getEndHour() == null
                ? LocalTime.of(23, 59)
                : task.getEndHour();

        LocalDateTime deadline = task.getEndDate().atTime(endTime);

        if (deadline.isBefore(LocalDateTime.now())) {
            return TaskStatus.LATE;
        }

        boolean hasActivity = task.getActivities() != null && !task.getActivities().isEmpty();

        return hasActivity ? TaskStatus.IN_PROGRESS : TaskStatus.PLANNED;
    }

    private TaskEquipmentResponse toEquipmentResponse(Equipment equipment) {
        if (equipment == null) {
            return null;
        }

        return new TaskEquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipmentImageUrl(equipment),
                equipment.getItemCode()
        );
    }

    private Set<TaskTagResponse> mapTags(Set<Tag> tags) {
        if (tags == null) {
            return Collections.emptySet();
        }

        return tags.stream()
                .map(tag -> new TaskTagResponse(
                        tag.getId(),
                        tag.getName(),
                        tag.getCode(),
                        tag.getColor()
                ))
                .collect(Collectors.toSet());
    }

    private Set<TaskAssigneeResponse> mapAssignees(Set<TaskAssignee> assignees) {
        if (assignees == null) {
            return Collections.emptySet();
        }

        return assignees.stream()
                .map(assignee -> {
                    if (assignee.getUser() != null) {
                        return new TaskAssigneeResponse(
                                assignee.getId(),
                                "USER",
                                assignee.getUser().getId(),
                                assignee.getUser().getFirstName() + " " +
                                        assignee.getUser().getLastName(),
                                assignee.getUser().getPhoto(),
                                null,
                                null
                        );
                    }

                    return new TaskAssigneeResponse(
                            assignee.getId(),
                            "TEAM",
                            null,
                            null,
                            null,
                            assignee.getTeam().getId(),
                            assignee.getTeam().getName()
                    );
                })
                .collect(Collectors.toSet());
    }

    private Set<TaskAssigneeResponse> mapAssignedTo(Set<TaskAssignedTo> assignedTo) {
        if (assignedTo == null) {
            return Collections.emptySet();
        }

        return assignedTo.stream()
                .map(assignee -> {
                    if (assignee.getUser() != null) {
                        return new TaskAssigneeResponse(
                                assignee.getId(),
                                "USER",
                                assignee.getUser().getId(),
                                assignee.getUser().getFirstName() + " " +
                                        assignee.getUser().getLastName(),
                                assignee.getUser().getPhoto(),
                                null,
                                null
                        );
                    }

                    return new TaskAssigneeResponse(
                            assignee.getId(),
                            "TEAM",
                            null,
                            null,
                            null,
                            assignee.getTeam().getId(),
                            assignee.getTeam().getName()
                    );
                })
                .collect(Collectors.toSet());
    }

    private Set<TaskSparePartResponse> mapSpareParts(Set<TaskSparePart> spareParts) {
        if (spareParts == null) {
            return Collections.emptySet();
        }

        return spareParts.stream()
                .map(line -> new TaskSparePartResponse(
                        line.getSparePart().getId(),
                        line.getSparePart().getCode(),
                        line.getSparePart().getName(),
                        sparePartImageUrl(line.getSparePart()),
                        line.getQuantity()
                ))
                .collect(Collectors.toSet());
    }

    private String equipmentImageUrl(Equipment equipment) {
        if (equipment == null) {
            return null;
        }

        if (equipment.getImageData() != null && equipment.getId() != null) {
            return "/api/equipment/" + equipment.getId() + "/image";
        }

        return equipment.getImage();
    }

    private String sparePartImageUrl(SparePart sparePart) {
        if (sparePart == null) {
            return null;
        }

        if (sparePart.getImageData() != null && sparePart.getId() != null) {
            return "/api/spare-parts/" + sparePart.getId() + "/image";
        }

        return sparePart.getImage();
    }

    private Set<TaskDocumentResponse> mapDocuments(Set<TaskDocument> documents) {
        if (documents == null) {
            return Collections.emptySet();
        }

        return documents.stream()
                .map(document -> new TaskDocumentResponse(
                        document.getId(),
                        document.getFileName(),
                        document.isLink()
                                ? document.getFilePath()
                                : "/api/tasks/documents/" + document.getId(),
                        document.getFileType(),
                        document.getPreviewFileData() != null
                                ? "/api/tasks/documents/" + document.getId() + "/preview"
                                : null,
                        document.getPreviewFileType(),
                        document.isLink(),
                        document.getUploadedAt()
                ))
                .collect(Collectors.toSet());
    }

    private Set<ActivityResponse> mapActivities(Set<Activity> activities) {
        if (activities == null) {
            return Collections.emptySet();
        }

        return activities.stream()
                .map(activity -> new ActivityResponse(
                        activity.getId(),
                        activity.getTask() != null ? activity.getTask().getId() : null,
                        activity.getTask() != null ? activity.getTask().getDescription() : null,
                        activity.getTask() != null && activity.getTask().getEquipment() != null
                                ? activity.getTask().getEquipment().getName()
                                : null,
                        activity.getDescription(),
                        activity.getPerformedDate(),
                        activity.getPerformedEndTime(),
                        activity.getSpentHours(),
                        activity.getSpentMinutes(),
                        activity.getStatus(),
                        Collections.emptyList(),
                        Collections.emptyList(),
                        Collections.emptyList(),
                        Collections.emptyList(),
                        Collections.emptyList(),
                        activity.getCreatedAt(),
                        activity.getUpdatedAt()
                ))
                .collect(Collectors.toSet());
    }
}
