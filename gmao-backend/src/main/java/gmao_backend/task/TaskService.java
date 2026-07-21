package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;

import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;

import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;

import com.gmao.gmao_backend.team.Team;
import com.gmao.gmao_backend.team.TeamRepository;

import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    private final EquipmentRepository equipmentRepository;

    private final UserRepository userRepository;

    private final TeamRepository teamRepository;

    private final TagRepository tagRepository;

    private final SparePartRepository sparePartRepository;

    private final TaskMapper mapper;

    private final TaskDocumentStorageService storage;

    @Transactional(readOnly = true)
    public List<TaskListItemResponse> findAll() {
        return taskRepository
                .findAllByOrderByStartDateDescStartHourDesc()
                .stream()
                .map(mapper::toListItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskSummaryResponse findSummary() {
        long totalTasks = taskRepository.count();

        long totalMinutes = taskRepository.sumPlannedMaintenanceMinutes();

        return new TaskSummaryResponse(
                totalTasks,
                (int) (totalMinutes / 60),
                (int) (totalMinutes % 60)
        );
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(Long id) {
        return mapper.toResponse(findEntityById(id));
    }

    @Transactional
    public TaskResponse create(
            CreateTaskRequest request,
            List<MultipartFile> documents
    ) {
        Task task = Task.builder()

                .equipmentOnly(request.equipmentOnly())

                .equipment(resolveEquipment(request.equipmentId()))

                .description(request.description().trim())

                .allDay(request.allDay())

                .startDate(request.startDate())

                .startHour(request.allDay() ? null : request.startHour())

                .endDate(request.endDate())

                .endHour(request.allDay() ? null : request.endHour())

                .plannedMaintenanceHours(request.plannedMaintenanceHours())

                .plannedMaintenanceMinutes(request.plannedMaintenanceMinutes())

                .plannedStoppedHours(request.plannedStoppedHours())

                .plannedStoppedMinutes(request.plannedStoppedMinutes())

                .status(TaskStatus.IN_PROGRESS)

                .tags(resolveTags(request.tagIds()))

                .build();

        task.setAssignees(
                resolveAssignees(task, request.assignees())
        );

        task.setAssignedTo(
                resolveAssignedTo(task, request.assignedTo())
        );

        task.setSpareParts(
                resolveSpareParts(task, request.spareParts())
        );

        task.setDocuments(
                buildDocuments(task, documents, request.links())
        );

        Task savedTask = taskRepository.save(task);

        return mapper.toResponse(savedTask);
    }

    @Transactional
    public TaskResponse update(
            Long id,
            UpdateTaskRequest request,
            List<MultipartFile> documents
    ) {
        Task task = findEntityById(id);

        task.setEquipmentOnly(request.equipmentOnly());

        task.setEquipment(resolveEquipment(request.equipmentId()));

        task.setDescription(request.description().trim());

        task.setAllDay(request.allDay());

        task.setStartDate(request.startDate());

        task.setStartHour(request.allDay() ? null : request.startHour());

        task.setEndDate(request.endDate());

        task.setEndHour(request.allDay() ? null : request.endHour());

        task.setPlannedMaintenanceHours(request.plannedMaintenanceHours());

        task.setPlannedMaintenanceMinutes(request.plannedMaintenanceMinutes());

        task.setPlannedStoppedHours(request.plannedStoppedHours());

        task.setPlannedStoppedMinutes(request.plannedStoppedMinutes());

        if (request.status() == TaskStatus.LATE || request.status() == TaskStatus.PLANNED) {
            throw new IllegalArgumentException(
                    "Les statuts « En retard » et « Planifiée » sont calculés automatiquement et ne peuvent pas être définis manuellement."
            );
        }

        task.setStatus(request.status());

        task.setTags(resolveTags(request.tagIds()));

        task.getAssignees().clear();

        task.getAssignees().addAll(
                resolveAssignees(task, request.assignees())
        );

        task.getAssignedTo().clear();

        task.getAssignedTo().addAll(
                resolveAssignedTo(task, request.assignedTo())
        );

        task.getSpareParts().clear();

        task.getSpareParts().addAll(
                resolveSpareParts(task, request.spareParts())
        );

        removeDocuments(task, request.removeDocumentIds());

        task.getDocuments().addAll(
                buildDocuments(task, documents, request.links())
        );

        Task savedTask = taskRepository.save(task);

        return mapper.toResponse(savedTask);
    }

    @Transactional
    public TaskResponse updateStatus(Long id, UpdateTaskStatusRequest request) {
        if (request.status() == TaskStatus.LATE || request.status() == TaskStatus.PLANNED) {
            throw new IllegalArgumentException(
                    "Les statuts « En retard » et « Planifiée » sont calculés automatiquement et ne peuvent pas être définis manuellement."
            );
        }

        Task task = findEntityById(id);

        task.setStatus(request.status());

        return mapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        Task task = findEntityById(id);

        for (TaskDocument document : task.getDocuments()) {
            if (!document.isLink()) {
                storage.delete(document.getFilePath());
            }
        }

        taskRepository.delete(task);
    }

    private Task findEntityById(Long id) {
        return taskRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Tâche introuvable."
                        )
                );
    }

    private Equipment resolveEquipment(Long equipmentId) {
        return equipmentRepository
                .findById(equipmentId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Équipement introuvable."
                        )
                );
    }

    private Set<Tag> resolveTags(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }

        List<Tag> foundTags = tagRepository.findAllById(ids);

        if (foundTags.size() != new HashSet<>(ids).size()) {
            throw new ResourceNotFoundException(
                    "Un ou plusieurs tags sont introuvables."
            );
        }

        return new HashSet<>(foundTags);
    }

    private Set<TaskAssignee> resolveAssignees(
            Task task,
            Set<AssigneeRequest> assigneeRequests
    ) {
        if (assigneeRequests == null || assigneeRequests.isEmpty()) {
            return new HashSet<>();
        }

        Set<TaskAssignee> assignees = new HashSet<>();

        for (AssigneeRequest assigneeRequest : assigneeRequests) {
            boolean hasUser = assigneeRequest.userId() != null;
            boolean hasTeam = assigneeRequest.teamId() != null;

            if (hasUser == hasTeam) {
                throw new IllegalArgumentException(
                        "Chaque assignation doit référencer soit un utilisateur, soit une équipe."
                );
            }

            User user = null;
            Team team = null;

            if (hasUser) {
                user = userRepository
                        .findById(assigneeRequest.userId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Utilisateur introuvable."
                                )
                        );
            } else {
                team = teamRepository
                        .findById(assigneeRequest.teamId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Équipe introuvable."
                                )
                        );
            }

            assignees.add(
                    TaskAssignee.builder()
                            .task(task)
                            .user(user)
                            .team(team)
                            .build()
            );
        }

        return assignees;
    }

    private Set<TaskAssignedTo> resolveAssignedTo(
            Task task,
            Set<AssigneeRequest> assigneeRequests
    ) {
        if (assigneeRequests == null || assigneeRequests.isEmpty()) {
            return new HashSet<>();
        }

        Set<TaskAssignedTo> assignedTo = new HashSet<>();

        for (AssigneeRequest assigneeRequest : assigneeRequests) {
            boolean hasUser = assigneeRequest.userId() != null;
            boolean hasTeam = assigneeRequest.teamId() != null;

            if (hasUser == hasTeam) {
                throw new IllegalArgumentException(
                        "Chaque assignation doit référencer soit un utilisateur, soit une équipe."
                );
            }

            User user = null;
            Team team = null;

            if (hasUser) {
                user = userRepository
                        .findById(assigneeRequest.userId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Utilisateur introuvable."
                                )
                        );
            } else {
                team = teamRepository
                        .findById(assigneeRequest.teamId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Équipe introuvable."
                                )
                        );
            }

            assignedTo.add(
                    TaskAssignedTo.builder()
                            .task(task)
                            .user(user)
                            .team(team)
                            .build()
            );
        }

        return assignedTo;
    }

    private Set<TaskSparePart> resolveSpareParts(
            Task task,
            Set<TaskSparePartRequest> sparePartRequests
    ) {
        if (sparePartRequests == null || sparePartRequests.isEmpty()) {
            return new HashSet<>();
        }

        Set<TaskSparePart> lines = new HashSet<>();

        for (TaskSparePartRequest line : sparePartRequests) {
            SparePart sparePart = sparePartRepository
                    .findById(line.sparePartId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException(
                                    "Pièce de rechange introuvable."
                            )
                    );

            lines.add(
                    TaskSparePart.builder()
                            .task(task)
                            .sparePart(sparePart)
                            .quantity(line.quantity())
                            .build()
            );
        }

        return lines;
    }

    private Set<TaskDocument> buildDocuments(
            Task task,
            List<MultipartFile> files,
            Set<TaskLinkRequest> links
    ) {
        Set<TaskDocument> documents = new HashSet<>();

        if (files != null) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }

                documents.add(
                        TaskDocument.builder()
                                .task(task)
                                .fileName(file.getOriginalFilename())
                                .filePath(storage.save(file))
                                .fileType(file.getContentType())
                                .build()
                );
            }
        }

        if (links != null) {
            for (TaskLinkRequest link : links) {
                documents.add(
                        TaskDocument.builder()
                                .task(task)
                                .fileName(link.name().trim())
                                .filePath(link.url().trim())
                                .fileType(TaskDocument.LINK_TYPE)
                                .build()
                );
            }
        }

        return documents;
    }

    private void removeDocuments(Task task, Set<Long> removeDocumentIds) {
        if (removeDocumentIds == null || removeDocumentIds.isEmpty()) {
            return;
        }

        task.getDocuments().removeIf(document -> {
            boolean shouldRemove = removeDocumentIds.contains(document.getId());

            if (shouldRemove && !document.isLink()) {
                storage.delete(document.getFilePath());
            }

            return shouldRemove;
        });
    }
}