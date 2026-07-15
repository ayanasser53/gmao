package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.tag.Tag;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        return new TaskResponse(

                task.getId(),

                task.isEquipmentOnly(),

                toEquipmentResponse(task.getEquipment()),

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

                resolveDisplayStatus(task),

                mapAssignees(task.getAssignees()),

                mapTags(task.getTags()),

                mapSpareParts(task.getSpareParts()),

                mapDocuments(task.getDocuments()),

                task.getCreatedAt(),

                task.getUpdatedAt()
        );
    }

    public TaskListItemResponse toListItemResponse(Task task) {
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

                mapTags(task.getTags()),

                resolveDisplayStatus(task)
        );
    }

    /**
     * The "late" status is never stored — it is derived on every read from
     * the task's end date/time compared to now, so the UI never needs to
     * set it manually. A task already marked DONE is never considered
     * late.
     */
    private TaskStatus resolveDisplayStatus(Task task) {
        if (task.getStatus() == TaskStatus.DONE) {
            return TaskStatus.DONE;
        }

        LocalTime endTime = task.isAllDay() || task.getEndHour() == null
                ? LocalTime.of(23, 59)
                : task.getEndHour();

        LocalDateTime deadline = task.getEndDate().atTime(endTime);

        return deadline.isBefore(LocalDateTime.now())
                ? TaskStatus.LATE
                : TaskStatus.IN_PROGRESS;
    }

    private TaskEquipmentResponse toEquipmentResponse(Equipment equipment) {
        if (equipment == null) {
            return null;
        }

        return new TaskEquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getImage(),
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

    private Set<TaskSparePartResponse> mapSpareParts(Set<TaskSparePart> spareParts) {
        if (spareParts == null) {
            return Collections.emptySet();
        }

        return spareParts.stream()
                .map(line -> new TaskSparePartResponse(
                        line.getSparePart().getId(),
                        line.getSparePart().getCode(),
                        line.getSparePart().getName(),
                        line.getSparePart().getImage(),
                        line.getQuantity()
                ))
                .collect(Collectors.toSet());
    }

    private Set<TaskDocumentResponse> mapDocuments(Set<TaskDocument> documents) {
        if (documents == null) {
            return Collections.emptySet();
        }

        return documents.stream()
                .map(document -> new TaskDocumentResponse(
                        document.getId(),
                        document.getFileName(),
                        document.getFilePath(),
                        document.getFileType(),
                        document.isLink(),
                        document.getUploadedAt()
                ))
                .collect(Collectors.toSet());
    }
}