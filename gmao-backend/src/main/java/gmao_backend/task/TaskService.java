package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;

import com.gmao.gmao_backend.notification.NotificationService;
import com.gmao.gmao_backend.notification.NotificationType;

import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.storage.DatabaseFile;
import com.gmao.gmao_backend.storage.OfficePreviewService;
import com.gmao.gmao_backend.storage.ServedDatabaseFile;

import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;

import com.gmao.gmao_backend.team.Team;
import com.gmao.gmao_backend.team.TeamRepository;

import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.user.Role;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    private final TaskSparePartRepository taskSparePartRepository;

    private final TaskDocumentRepository taskDocumentRepository;

    private final TaskMapper mapper;

    private final TaskDocumentStorageService storage;

    private final OfficePreviewService officePreviewService;

    private final CurrentUserProvider currentUserProvider;

    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TaskListItemResponse> findAll() {
        return taskRepository
               .findAllByUsineIdOrderByCreatedAtDesc(currentUserProvider.requireUsineId())
                .stream()
                .map(mapper::toListItemResponse)
                .toList();
    }

    /**
     * Taches affectees a l'utilisateur courant, sur n'importe quelle usine.
     * Utilise par le portail prestataire (un prestataire peut intervenir
     * sur plusieurs usines et n'a donc pas de liste "toutes les taches de
     * mon usine" pertinente).
     */
    @Transactional(readOnly = true)
    public List<TaskListItemResponse> findAssignedToMe() {
        User currentUser = resolveCurrentUser();

        return taskRepository
                .findAllAssignedToUserOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(mapper::toListItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskListItemResponse> findMyCreatedTasks() {
        User currentUser = resolveCurrentUser();

        return taskRepository
                .findAllByCreatedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(mapper::toOperatorListItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse findMyCreatedTaskById(Long id) {
        User currentUser = resolveCurrentUser();
        Task task = findEntityById(id);

        if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Tache introuvable.");
        }

        return mapper.toOperatorResponse(task);
    }

    @Transactional(readOnly = true)
    public TaskSummaryResponse findSummary() {
        Long usineId = currentUserProvider.requireUsineId();

        long totalTasks = taskRepository.findAllByUsineIdOrderByCreatedAtDesc(usineId).size();

        long totalMinutes = taskRepository.sumPlannedMaintenanceMinutes(usineId);

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

    @Transactional(readOnly = true)
    public ServedDatabaseFile getDocument(Long documentId) {
        TaskDocument document = taskDocumentRepository
                .findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document introuvable."));

        if (document.isLink() || document.getFileData() == null || document.getFileData().length == 0) {
            throw new ResourceNotFoundException("Fichier introuvable.");
        }

        return new ServedDatabaseFile(
                document.getFileName(),
                document.getFileType(),
                document.getFileData()
        );
    }

    @Transactional(readOnly = true)
    public ServedDatabaseFile getDocumentPreview(Long documentId) {
        TaskDocument document = taskDocumentRepository
                .findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document introuvable."));

        if (document.getPreviewFileData() == null || document.getPreviewFileData().length == 0) {
            throw new ResourceNotFoundException("Apercu introuvable.");
        }

        return new ServedDatabaseFile(
                document.getFileName().replaceFirst("\\.[^.]+$", ".pdf"),
                document.getPreviewFileType(),
                document.getPreviewFileData()
        );
    }

    @Transactional
    public TaskResponse create(
            CreateTaskRequest request,
            List<MultipartFile> documents
    ) {
        User currentUser = resolveCurrentUserOrNull();

        Task task = Task.builder()

                .equipmentOnly(request.equipmentOnly())

                .equipment(resolveEquipment(request.equipmentId()))

                .createdBy(currentUser)

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

                .status(currentUser != null
                        && (currentUser.getRole() == Role.PRODUCTION
                                || currentUser.getRole() == Role.SERVICE_PROVIDER
                                || currentUser.getRole() == Role.TECHNICIAN)
                        ? TaskStatus.CREATED
                        : TaskStatus.IN_PROGRESS)

                .tags(resolveTags(request.tagIds()))

                .build();

        task.setAssignees(
                resolveReporterAssignee(task, currentUser)
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

        notifyAssignees(savedTask, currentUser);

        return mapper.toResponse(savedTask);
    }

    /**
     * Previent chaque utilisateur directement affecte (hors equipes) de la
     * nouvelle tache, sauf s'il en est lui-meme l'auteur.
     */
    private void notifyAssignees(Task task, User actor) {
        java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();

        java.util.stream.Stream.concat(
                task.getAssignees().stream().map(TaskAssignee::getUser),
                task.getAssignedTo().stream().map(TaskAssignedTo::getUser)
        )
                .filter(java.util.Objects::nonNull)
                .filter(user -> actor == null || !user.getId().equals(actor.getId()))
                .filter(user -> notifiedUserIds.add(user.getId()))
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.TASK_ASSIGNED,
                        "Nouvelle tache assignee",
                        task.getDescription(),
                        "/tasks/" + task.getId()
                ));
    }

    @Transactional
    public TaskResponse update(
            Long id,
            UpdateTaskRequest request,
            List<MultipartFile> documents
    ) {
        Task task = findEntityById(id);

        java.util.Set<Long> previouslyAssignedUserIds = previouslyAssignedUserIds(task);

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

        // Une tache annulee reste annulee : ce formulaire d'edition generique
        // ne peut pas la reactiver (seule l'action dediee "Annuler" gere ce
        // statut, et uniquement pour un administrateur).
        if (task.getStatus() == TaskStatus.CANCELED) {
            task.setStatus(TaskStatus.CANCELED);
        } else {
            if (request.status() == TaskStatus.LATE
                    || request.status() == TaskStatus.PLANNED
                    || request.status() == TaskStatus.CREATED
                    || request.status() == TaskStatus.CANCELED
                    || request.status() == TaskStatus.ARCHIVED) {
                throw new IllegalArgumentException(
                        "Les statuts En retard, Planifiee, Creee, Annulee et Archivee sont calcules ou reserves et ne peuvent pas etre definis via ce formulaire."
                );
            }

            // Une tache signalee par un operateur/prestataire (statut "Creee")
            // passe automatiquement en "Planifiee" des qu'elle est modifiee
            // ici, c'est-a-dire des que l'admin la planifie/assigne via cette
            // fiche d'edition.
            task.setStatus(
                    task.getStatus() == TaskStatus.CREATED
                            ? TaskStatus.PLANNED
                            : request.status()
            );
        }

        task.setTags(resolveTags(request.tagIds()));

        task.getAssignedTo().clear();

        task.getAssignedTo().addAll(
                resolveAssignedTo(task, request.assignedTo())
        );

        task.getSpareParts().clear();
        taskSparePartRepository.deleteAllByTaskId(task.getId());
        taskSparePartRepository.flush();

        task.getSpareParts().addAll(
                resolveSpareParts(task, request.spareParts())
        );

        removeDocuments(task, request.removeDocumentIds());

        task.getDocuments().addAll(
                buildDocuments(task, documents, request.links())
        );

        Task savedTask = taskRepository.save(task);

        notifyNewAssignees(savedTask, previouslyAssignedUserIds, resolveCurrentUserOrNull());

        return mapper.toResponse(savedTask);
    }

    private java.util.Set<Long> previouslyAssignedUserIds(Task task) {
        java.util.Set<Long> ids = new java.util.HashSet<>();

        task.getAssignees().stream()
                .map(TaskAssignee::getUser)
                .filter(java.util.Objects::nonNull)
                .forEach(user -> ids.add(user.getId()));

        task.getAssignedTo().stream()
                .map(TaskAssignedTo::getUser)
                .filter(java.util.Objects::nonNull)
                .forEach(user -> ids.add(user.getId()));

        return ids;
    }

    /**
     * Previent uniquement les utilisateurs nouvellement affectes (absents
     * de l'ancienne liste), pour ne pas re-notifier a chaque modification
     * d'une tache des personnes deja affectees.
     */
    private void notifyNewAssignees(Task task, java.util.Set<Long> previouslyAssignedUserIds, User actor) {
        java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();

        java.util.stream.Stream.concat(
                task.getAssignees().stream().map(TaskAssignee::getUser),
                task.getAssignedTo().stream().map(TaskAssignedTo::getUser)
        )
                .filter(java.util.Objects::nonNull)
                .filter(user -> !previouslyAssignedUserIds.contains(user.getId()))
                .filter(user -> actor == null || !user.getId().equals(actor.getId()))
                .filter(user -> notifiedUserIds.add(user.getId()))
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.TASK_ASSIGNED,
                        "Nouvelle tache assignee",
                        task.getDescription(),
                        "/tasks/" + task.getId()
                ));
    }

    @Transactional
    public TaskResponse updateStatus(Long id, UpdateTaskStatusRequest request) {
        if (request.status() == TaskStatus.LATE
                || request.status() == TaskStatus.PLANNED
                || request.status() == TaskStatus.CREATED) {
            throw new IllegalArgumentException(
                    "Les statuts En retard, Planifiee et Creee sont calcules automatiquement et ne peuvent pas etre definis manuellement."
            );
        }

        Task task = findEntityById(id);

        if (task.getStatus() == TaskStatus.ARCHIVED && request.status() != TaskStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Une tache archivee ne peut pas changer de statut."
            );
        }

        if (task.getStatus() == TaskStatus.CANCELED
                && request.status() != TaskStatus.CANCELED
                && request.status() != TaskStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Une tache annulee ne peut pas etre remise en cours ou terminee."
            );
        }

        if (request.status() == TaskStatus.CANCELED || request.status() == TaskStatus.ARCHIVED) {
            User actor = resolveCurrentUserOrNull();

            if (actor == null || actor.getRole() != Role.ADMIN) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Seul un administrateur peut annuler ou archiver une tache."
                );
            }

            if (request.status() == TaskStatus.ARCHIVED && task.getStatus() == TaskStatus.ARCHIVED) {
                throw new IllegalArgumentException(
                        "Cette tache est deja archivee."
                );
            }

            if (request.status() == TaskStatus.CANCELED && task.getStatus() == TaskStatus.DONE) {
                throw new IllegalArgumentException(
                        "Une tache deja terminee ne peut pas etre annulee."
                );
            }

            if (request.status() == TaskStatus.CANCELED && task.getStatus() == TaskStatus.CANCELED) {
                throw new IllegalArgumentException(
                        "Cette tache est deja annulee."
                );
            }
        }

        task.setStatus(request.status());

        Task savedStatusTask = taskRepository.save(task);

        User creator = task.getCreatedBy();
        User actor = resolveCurrentUserOrNull();

        java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();

        if (creator != null && (actor == null || !creator.getId().equals(actor.getId()))) {
            notificationService.notify(
                    creator,
                    NotificationType.TASK_STATUS_CHANGED,
                    "Statut de tache mis a jour",
                    task.getDescription() + " est maintenant " + statusLabel(request.status()) + ".",
                    "/tasks/" + task.getId()
            );

            notifiedUserIds.add(creator.getId());
        }

        java.util.stream.Stream.concat(
                task.getAssignees().stream().map(TaskAssignee::getUser),
                task.getAssignedTo().stream().map(TaskAssignedTo::getUser)
        )
                .filter(java.util.Objects::nonNull)
                .filter(user -> actor == null || !user.getId().equals(actor.getId()))
                .filter(user -> notifiedUserIds.add(user.getId()))
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.TASK_STATUS_CHANGED,
                        "Statut de tache mis a jour",
                        task.getDescription() + " est maintenant " + statusLabel(request.status()) + ".",
                        "/tasks/" + task.getId()
                ));

        return mapper.toResponse(savedStatusTask);
    }

    private String statusLabel(TaskStatus status) {
        return switch (status) {
            case CREATED -> "Creee";
            case PLANNED -> "Planifiee";
            case IN_PROGRESS -> "En cours";
            case LATE -> "En retard";
            case DONE -> "Terminee";
            case CANCELED -> "Annulee";
            case ARCHIVED -> "Archivee";
        };
    }

    @Transactional
    public void delete(Long id) {
        Task task = findEntityById(id);

        taskRepository.delete(task);
    }

    private Task findEntityById(Long id) {
        Long usineId = currentUserProvider.getUsineIdOrNull();

        if (usineId != null) {
            java.util.Optional<Task> scoped = taskRepository.findByIdAndUsineId(id, usineId);

            if (scoped.isPresent()) {
                return scoped.get();
            }
        }

        // Un prestataire peut etre affecte a une tache en dehors de son
        // usine de rattachement : on l'autorise s'il fait partie des
        // personnes affectees a cette tache precise.
        User currentUser = resolveCurrentUserOrNull();

        if (currentUser != null) {
            java.util.Optional<Task> assigned =
                    taskRepository.findByIdAssignedToUser(id, currentUser.getId());

            if (assigned.isPresent()) {
                return assigned.get();
            }
        }

        throw new ResourceNotFoundException("Tache introuvable.");
    }

    private Equipment resolveEquipment(Long equipmentId) {
        return equipmentRepository
                .findByIdAndUsineId(equipmentId, currentUserProvider.requireUsineId())
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Equipement introuvable."
                        )
                );
    }

    private User resolveCurrentUser() {
        return currentUserProvider.getUser();
    }

    private User resolveCurrentUserOrNull() {
        try {
            return currentUserProvider.getUser();
        } catch (RuntimeException exception) {
            return null;
        }
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
                        "Chaque assignation doit referencer soit un utilisateur, soit une equipe."
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

                if (!isExecutableRole(user)) {
                    throw new IllegalArgumentException(
                            "Une tache peut etre assignee uniquement a un technicien ou un prestataire."
                    );
                }
            } else {
                team = teamRepository
                        .findById(assigneeRequest.teamId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Equipe introuvable."
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

    private Set<TaskAssignee> resolveReporterAssignee(Task task, User currentUser) {
        if (currentUser == null) {
            return new HashSet<>();
        }

        Set<TaskAssignee> assignees = new HashSet<>();
        assignees.add(
                TaskAssignee.builder()
                        .task(task)
                        .user(currentUser)
                        .build()
        );

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
                        "Chaque assignation doit referencer soit un utilisateur, soit une equipe."
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
                                        "Equipe introuvable."
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

    private boolean isExecutableRole(User user) {
        return user.getRole() == Role.TECHNICIAN
                || user.getRole() == Role.SERVICE_PROVIDER;
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
                                    "Piece de rechange introuvable."
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

                DatabaseFile databaseFile = storage.save(file);

                if (databaseFile == null) {
                    continue;
                }

                TaskDocument document = TaskDocument.builder()
                        .task(task)
                        .fileName(databaseFile.fileName())
                        .filePath("db-file")
                        .fileType(databaseFile.contentType())
                        .fileSize((long) databaseFile.data().length)
                        .fileData(databaseFile.data())
                        .build();

                officePreviewService.createPdfPreview(databaseFile)
                        .ifPresent(preview -> {
                            document.setPreviewFileType(preview.contentType());
                            document.setPreviewFileSize((long) preview.data().length);
                            document.setPreviewFileData(preview.data());
                        });

                documents.add(document);
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

            return shouldRemove;
        });
    }
}
