package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.notification.NotificationService;
import com.gmao.gmao_backend.notification.NotificationType;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.sparepart.SparePartStockMovement;
import com.gmao.gmao_backend.sparepart.SparePartStockMovementRepository;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.user.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final EquipmentRepository equipmentRepository;
    private final SparePartRepository sparePartRepository;
    private final SparePartStockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    public List<MaintenancePlanResponse> findAll() {
        Long usineId = currentUserProvider.requireUsineId();
        ensureDueOccurrences(usineId);

        return maintenancePlanRepository.findAllByUsineId(usineId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MaintenancePlanResponse findById(Long id) {
        return toResponse(resolvePlan(id));
    }

    public List<MaintenancePlanResponse> findMine() {
        Long usineId = currentUserProvider.requireUsineId();
        ensureDueOccurrences(usineId);
        User currentUser = currentUserProvider.getUser();

        return maintenancePlanRepository.findMineByAssigneeIdAndUsineId(currentUser.getId(), usineId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Mes plans de maintenance, toutes usines confondues. Utilise par le portail prestataire.
     */
    public List<MaintenancePlanResponse> findMineAnyUsine() {
        User currentUser = currentUserProvider.getUser();

        return maintenancePlanRepository.findMineByAssigneeId(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MaintenancePlanResponse create(MaintenancePlanRequest request) {
        Equipment equipment = equipmentRepository.findByIdAndUsineId(request.equipmentId(), currentUserProvider.requireUsineId())
                .orElseThrow(() -> new RuntimeException("Equipement introuvable"));

        MaintenancePlan plan = MaintenancePlan.builder()
                .equipment(equipment)
                .equipmentOnly(request.equipmentOnly())
                .description(request.description())
                .regulatory(request.regulatory())
                .triggerType(request.triggerType())
                .frequencyValue(request.frequencyValue())
                .frequencyUnit(request.frequencyUnit())
                .startDate(request.startDate())
                .nextDueDate(resolveNextDueDate(request))
                .plannedMaintenanceHours(request.plannedMaintenanceHours())
                .plannedMaintenanceMinutes(request.plannedMaintenanceMinutes())
                .plannedStoppedHours(request.plannedStoppedHours())
                .plannedStoppedMinutes(request.plannedStoppedMinutes())
                .status(MaintenancePlanStatus.PLANNED)
                .build();

        applySpareParts(plan, request.spareParts());
        applyAssignees(plan, request.assigneeIds());
        applyTags(plan, request.tagIds());

        MaintenancePlan savedPlan = maintenancePlanRepository.save(plan);

        notifyNewAssignees(savedPlan, java.util.Set.of(), currentUserProvider.getUser());

        return toResponse(savedPlan);
    }

    public MaintenancePlanResponse update(Long id, MaintenancePlanRequest request) {
        MaintenancePlan plan = maintenancePlanRepository.findByIdAndUsineId(id, currentUserProvider.requireUsineId())
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));

        if (plan.getStatus() == MaintenancePlanStatus.CANCELLED) {
            throw new IllegalArgumentException("Un plan de maintenance annule ne peut pas etre modifie.");
        }

        Equipment equipment = equipmentRepository.findByIdAndUsineId(request.equipmentId(), currentUserProvider.requireUsineId())
                .orElseThrow(() -> new RuntimeException("Equipement introuvable"));

        plan.setEquipment(equipment);
        plan.setEquipmentOnly(request.equipmentOnly());
        plan.setDescription(request.description());
        plan.setRegulatory(request.regulatory());
        plan.setTriggerType(request.triggerType());
        plan.setFrequencyValue(request.frequencyValue());
        plan.setFrequencyUnit(request.frequencyUnit());
        plan.setStartDate(request.startDate());
        plan.setNextDueDate(resolveNextDueDate(request));
        plan.setPlannedMaintenanceHours(request.plannedMaintenanceHours());
        plan.setPlannedMaintenanceMinutes(request.plannedMaintenanceMinutes());
        plan.setPlannedStoppedHours(request.plannedStoppedHours());
        plan.setPlannedStoppedMinutes(request.plannedStoppedMinutes());

        MaintenancePlanStatus nextStatus = resolveSavedStatus(request.status());

        if (nextStatus == MaintenancePlanStatus.CANCELLED
                && currentUserProvider.getUser().getRole() != Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Seul un administrateur peut annuler un plan de maintenance."
            );
        }

        plan.setStatus(nextStatus);
        applySpareParts(plan, request.spareParts());
        applyTags(plan, request.tagIds());

        java.util.Set<Long> previouslyAssignedUserIds = plan.getAssignees()
                .stream()
                .map(MaintenancePlanAssignee::getUser)
                .filter(java.util.Objects::nonNull)
                .map(com.gmao.gmao_backend.user.User::getId)
                .collect(java.util.stream.Collectors.toSet());

        applyAssignees(plan, request.assigneeIds());

        MaintenancePlan savedPlan = maintenancePlanRepository.save(plan);

        notifyNewAssignees(savedPlan, previouslyAssignedUserIds, currentUserProvider.getUser());

        return toResponse(savedPlan);
    }

    /**
     * Previent uniquement les utilisateurs nouvellement affectes a ce plan.
     */
    private void notifyNewAssignees(
            MaintenancePlan plan,
            java.util.Set<Long> previouslyAssignedUserIds,
            User actor
    ) {
        java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();

        plan.getAssignees()
                .stream()
                .map(MaintenancePlanAssignee::getUser)
                .filter(java.util.Objects::nonNull)
                .filter(user -> !previouslyAssignedUserIds.contains(user.getId()))
                .filter(user -> actor == null || !user.getId().equals(actor.getId()))
                .filter(user -> notifiedUserIds.add(user.getId()))
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.MAINTENANCE_PLAN_ASSIGNED,
                        "Plan de maintenance assigne",
                        plan.getDescription(),
                        "/maintenance-plans/" + plan.getId()
                ));
    }

    public MaintenancePlanResponse updateStatus(Long id, MaintenancePlanStatus status) {
        MaintenancePlan plan = resolvePlan(id);

        MaintenancePlanStatus previousStatus = plan.getStatus();
        MaintenancePlanStatus nextStatus = resolveSavedStatus(status);

        if (nextStatus == MaintenancePlanStatus.CANCELLED) {
            User actor = currentUserProvider.getUser();

            if (actor.getRole() != Role.ADMIN) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Seul un administrateur peut annuler un plan de maintenance."
                );
            }

            List<MaintenancePlan> seriesPlans = findPlanSeries(plan);
            if (seriesPlans.isEmpty()) {
                seriesPlans = List.of(plan);
            }
            seriesPlans.forEach(seriesPlan -> seriesPlan.setStatus(MaintenancePlanStatus.CANCELLED));
            maintenancePlanRepository.saveAll(seriesPlans);

            if (previousStatus != MaintenancePlanStatus.CANCELLED) {
                notifyAssigneesOfStatusChange(plan, nextStatus);
            }

            return toResponse(plan);
        }

        plan.setStatus(nextStatus);
        MaintenancePlan savedPlan = maintenancePlanRepository.save(plan);

        boolean justCompleted =
                nextStatus == MaintenancePlanStatus.DONE
                        && previousStatus != MaintenancePlanStatus.DONE;

        if (justCompleted) {
            consumeSpareParts(savedPlan);
        }

        if (nextStatus == MaintenancePlanStatus.IN_PROGRESS
                || nextStatus == MaintenancePlanStatus.DONE
                || nextStatus == MaintenancePlanStatus.LATE) {
            createNextOccurrenceIfMissing(savedPlan, LocalDate.now());
        }

        if (nextStatus != previousStatus) {
            notifyAssigneesOfStatusChange(savedPlan, nextStatus);
        }

        return toResponse(savedPlan);
    }

    private List<MaintenancePlan> findPlanSeries(MaintenancePlan plan) {
        return maintenancePlanRepository.findSeriesBySignature(
                plan.getEquipment().getId(),
                plan.getEquipment().getUsine().getId(),
                plan.isEquipmentOnly(),
                plan.getDescription(),
                plan.isRegulatory(),
                plan.getTriggerType(),
                plan.getFrequencyValue(),
                plan.getFrequencyUnit(),
                plan.getPlannedMaintenanceHours(),
                plan.getPlannedMaintenanceMinutes(),
                plan.getPlannedStoppedHours(),
                plan.getPlannedStoppedMinutes()
        );
    }

    /**
     * Previent chaque affecte qu'un plan de maintenance a change de statut.
     */
    private void notifyAssigneesOfStatusChange(MaintenancePlan plan, MaintenancePlanStatus status) {
        User actor = currentUserProvider.getUser();

        plan.getAssignees()
                .stream()
                .map(MaintenancePlanAssignee::getUser)
                .filter(java.util.Objects::nonNull)
                .filter(user -> !user.getId().equals(actor.getId()))
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.MAINTENANCE_PLAN_DUE,
                        "Plan de maintenance mis a jour",
                        "\"" + plan.getDescription() + "\" est maintenant \""
                                + planStatusLabel(status) + "\".",
                        "/maintenance-plans/" + plan.getId()
                ));
    }

    private String planStatusLabel(MaintenancePlanStatus status) {
        return switch (status) {
            case PLANNED -> "Planifie";
            case IN_PROGRESS -> "En cours";
            case LATE -> "En retard";
            case DONE -> "Termine";
            case CANCELLED -> "Annule";
        };
    }

    /**
     * Decremente le stock des pieces liees quand le plan passe au statut termine.
     */
    private void consumeSpareParts(MaintenancePlan plan) {
        for (MaintenancePlanSparePart line : plan.getSpareParts()) {
            SparePart sparePart = line.getSparePart();

            BigDecimal currentStock = sparePart.getQuantity() == null
                    ? BigDecimal.ZERO
                    : sparePart.getQuantity();
            sparePart.setQuantity(currentStock.subtract(BigDecimal.valueOf(line.getQuantity())));
            sparePartRepository.save(sparePart);

            SparePartStockMovement movement = SparePartStockMovement.builder()
                    .sparePart(sparePart)
                    .source("Plan de maintenance")
                    .reference("Plan #" + plan.getId())
                    .maintenancePlanId(plan.getId())
                    .maintenancePlanDescription(plan.getDescription())
                    .movementType("CONSOMMATION")
                    .quantity(BigDecimal.valueOf(line.getQuantity()).negate())
                    .unitCost(sparePart.getUnitPrice())
                    .userName(currentUserName())
                    .movementDate(LocalDateTime.now())
                    .build();

            stockMovementRepository.save(movement);
        }
    }

    private String currentUserName() {
        try {
            var user = currentUserProvider.getUser();
            return (user.getFirstName() + " " + user.getLastName()).trim();
        } catch (RuntimeException exception) {
            return null;
        }
    }

    /**
     * Resout un plan par id dans l'usine courante ou parmi les plans affectes.
     */
    private MaintenancePlan resolvePlan(Long id) {
        Long usineId = currentUserProvider.getUsineIdOrNull();

        if (usineId != null) {
            var scoped = maintenancePlanRepository.findByIdAndUsineId(id, usineId);

            if (scoped.isPresent()) {
                return scoped.get();
            }
        }

        User currentUser = currentUserProvider.getUser();

        return maintenancePlanRepository.findByIdAssignedToUser(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));
    }

    public void delete(Long id) {
        MaintenancePlan plan = maintenancePlanRepository.findByIdAndUsineId(id, currentUserProvider.requireUsineId())
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));

        maintenancePlanRepository.delete(plan);
    }

    private void applySpareParts(
            MaintenancePlan plan,
            List<MaintenancePlanSparePartRequest> sparePartRequests
    ) {
        plan.getSpareParts().clear();

        if (sparePartRequests == null) {
            return;
        }

        for (MaintenancePlanSparePartRequest item : sparePartRequests) {
            if (item.sparePartId() == null) {
                continue;
            }

            SparePart sparePart = sparePartRepository.findById(item.sparePartId())
                    .orElseThrow(() -> new RuntimeException("Piece detachee introuvable"));

            plan.getSpareParts().add(
                    MaintenancePlanSparePart.builder()
                            .maintenancePlan(plan)
                            .sparePart(sparePart)
                            .quantity(Math.max(1, item.quantity()))
                            .build()
            );
        }
    }

    private void applyAssignees(MaintenancePlan plan, List<Long> assigneeIds) {
        plan.getAssignees().clear();

        if (assigneeIds == null || assigneeIds.isEmpty()) {
            return;
        }

        userRepository.findAllById(assigneeIds)
                .forEach(user -> {
                    if (!isExecutableRole(user)) {
                        throw new IllegalArgumentException(
                                "Un plan de maintenance peut etre assigne uniquement a un technicien ou un prestataire."
                        );
                    }

                    plan.getAssignees().add(
                            MaintenancePlanAssignee.builder()
                                    .maintenancePlan(plan)
                                    .user(user)
                                    .build()
                    );
                });
    }

    private boolean isExecutableRole(User user) {
        return user.getRole() == Role.TECHNICIAN
                || user.getRole() == Role.SERVICE_PROVIDER;
    }

    private void applyTags(MaintenancePlan plan, List<Long> tagIds) {
        plan.getTags().clear();

        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }

        Set<Long> uniqueIds = new HashSet<>(tagIds);
        List<Tag> tags = tagRepository.findAllById(uniqueIds);

        if (tags.size() != uniqueIds.size()) {
            throw new IllegalArgumentException("Un ou plusieurs labels sont introuvables.");
        }

        plan.getTags().addAll(tags);
    }

    private MaintenancePlanResponse toResponse(MaintenancePlan plan) {
        Equipment equipment = plan.getEquipment();

        return new MaintenancePlanResponse(
                plan.getId(),
                equipment.getId(),
                equipment.getName(),
                equipment.getImage(),
                equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getName()
                        : "-",
                plan.getDescription(),
                plan.isEquipmentOnly(),
                plan.isRegulatory(),
                plan.getTriggerType(),
                getTriggerLabel(plan),
                plan.getFrequencyValue(),
                plan.getFrequencyUnit(),
                getFrequencyLabel(plan),
                plan.getStartDate(),
                plan.getNextDueDate(),
                plan.getPlannedMaintenanceHours(),
                plan.getPlannedMaintenanceMinutes(),
                plan.getPlannedStoppedHours(),
                plan.getPlannedStoppedMinutes(),
                plan.getStatus(),
                plan.getSpareParts()
                        .stream()
                        .map(this::toSparePartResponse)
                        .toList(),
                plan.getAssignees()
                        .stream()
                        .map(this::toAssigneeResponse)
                        .toList(),
                plan.getTags()
                        .stream()
                        .map(tag -> new MaintenancePlanResponse.TagResponse(
                                tag.getId(),
                                tag.getName(),
                                tag.getColor()
                        ))
                        .toList(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private MaintenancePlanAssigneeResponse toAssigneeResponse(MaintenancePlanAssignee assignee) {
        User user = assignee.getUser();

        return new MaintenancePlanAssigneeResponse(
                assignee.getId(),
                user != null ? "USER" : "TEAM",
                user != null ? user.getId() : null,
                user != null ? (user.getFirstName() + " " + user.getLastName()).trim() : null,
                user != null ? user.getPhoto() : null,
                assignee.getTeam() != null ? assignee.getTeam().getId() : null,
                assignee.getTeam() != null ? assignee.getTeam().getName() : null
        );
    }

    private MaintenancePlanSparePartResponse toSparePartResponse(
            MaintenancePlanSparePart planSparePart
    ) {
        SparePart sparePart = planSparePart.getSparePart();

        return new MaintenancePlanSparePartResponse(
                sparePart.getId(),
                sparePart.getName(),
                sparePart.getCode(),
                sparePart.getImage(),
                planSparePart.getQuantity()
        );
    }

    private LocalDate resolveNextDueDate(MaintenancePlanRequest request) {
        if (request.nextDueDate() != null) {
            return request.nextDueDate();
        }

        return request.startDate();
    }

    private MaintenancePlanStatus resolveSavedStatus(MaintenancePlanStatus requestedStatus) {
        return requestedStatus == null ? MaintenancePlanStatus.PLANNED : requestedStatus;
    }

    private void ensureDueOccurrences(Long usineId) {
        List<MaintenancePlan> existingPlans = maintenancePlanRepository.findAllByUsineId(usineId);
        Set<String> existingKeys = new HashSet<>(
                existingPlans.stream()
                        .map(this::getOccurrenceKey)
                        .toList()
        );
        List<MaintenancePlan> plansToCreate = new ArrayList<>();
        List<MaintenancePlan> plansToUpdate = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (MaintenancePlan source : existingPlans) {
            if (source.getStatus() == MaintenancePlanStatus.CANCELLED) {
                continue;
            }

            if (!isRecurringPlan(source) || source.getNextDueDate() == null) {
                continue;
            }

            if (!shouldGenerateNextOccurrence(source, today)) {
                continue;
            }

            if (source.getStatus() == MaintenancePlanStatus.PLANNED) {
                source.setStatus(MaintenancePlanStatus.LATE);
                plansToUpdate.add(source);
            }

            LocalDate nextDate = getFirstNextDueDate(source, today);
            MaintenancePlan nextPlan = copyForOccurrence(source, nextDate);
            String key = getOccurrenceKey(nextPlan);

            if (!existingKeys.contains(key)) {
                existingKeys.add(key);
                plansToCreate.add(nextPlan);
            }
        }

        if (!plansToUpdate.isEmpty()) {
            maintenancePlanRepository.saveAll(plansToUpdate);
            plansToUpdate.forEach(this::notifyAssigneesOfLatePlan);
        }

        if (!plansToCreate.isEmpty()) {
            maintenancePlanRepository.saveAll(plansToCreate);
        }
    }

    /**
     * Previent chaque utilisateur directement affecte qu'un plan de maintenance vient de passer en retard.
     */
    private void notifyAssigneesOfLatePlan(MaintenancePlan plan) {
        plan.getAssignees()
                .stream()
                .map(MaintenancePlanAssignee::getUser)
                .filter(java.util.Objects::nonNull)
                .forEach(user -> notificationService.notify(
                        user,
                        NotificationType.MAINTENANCE_PLAN_DUE,
                        "Plan de maintenance en retard",
                        "\"" + plan.getDescription() + "\" est maintenant en retard.",
                        "/maintenance-plans/" + plan.getId()
                ));
    }

    private void createNextOccurrenceIfMissing(MaintenancePlan source, LocalDate today) {
        if (source.getStatus() == MaintenancePlanStatus.CANCELLED) {
            return;
        }

        if (!isRecurringPlan(source) || source.getNextDueDate() == null) {
            return;
        }

        LocalDate nextDate = getFirstNextDueDate(source, today);
        MaintenancePlan nextPlan = copyForOccurrence(source, nextDate);
        String nextKey = getOccurrenceKey(nextPlan);

        boolean alreadyExists = maintenancePlanRepository
                .findAllByUsineId(source.getEquipment().getUsine().getId())
                .stream()
                .map(this::getOccurrenceKey)
                .anyMatch(nextKey::equals);

        if (!alreadyExists) {
            maintenancePlanRepository.save(nextPlan);
        }
    }

    private boolean shouldGenerateNextOccurrence(MaintenancePlan plan, LocalDate today) {
        return !plan.getNextDueDate().isAfter(today);
    }

    private boolean isRecurringPlan(MaintenancePlan plan) {
        return plan.getFrequencyValue() > 0
                && Set.of("DAYS", "WEEKS", "MONTHS", "YEARS").contains(plan.getFrequencyUnit());
    }

    private LocalDate addInterval(LocalDate date, int value, String unit) {
        return switch (unit) {
            case "DAYS" -> date.plusDays(value);
            case "WEEKS" -> date.plusWeeks(value);
            case "MONTHS" -> date.plusMonths(value);
            case "YEARS" -> date.plusYears(value);
            default -> date;
        };
    }

    private LocalDate getFirstNextDueDate(MaintenancePlan source, LocalDate today) {
        LocalDate nextDate = addInterval(
                source.getNextDueDate(),
                source.getFrequencyValue(),
                source.getFrequencyUnit()
        );
        int guard = 0;

        while (!nextDate.isAfter(today) && guard < 366) {
            nextDate = addInterval(nextDate, source.getFrequencyValue(), source.getFrequencyUnit());
            guard++;
        }

        return nextDate;
    }

    private MaintenancePlan copyForOccurrence(MaintenancePlan source, LocalDate dueDate) {
        MaintenancePlan nextPlan = MaintenancePlan.builder()
                .equipment(source.getEquipment())
                .equipmentOnly(source.isEquipmentOnly())
                .description(source.getDescription())
                .regulatory(source.isRegulatory())
                .triggerType(source.getTriggerType())
                .frequencyValue(source.getFrequencyValue())
                .frequencyUnit(source.getFrequencyUnit())
                .startDate(dueDate)
                .nextDueDate(dueDate)
                .plannedMaintenanceHours(source.getPlannedMaintenanceHours())
                .plannedMaintenanceMinutes(source.getPlannedMaintenanceMinutes())
                .plannedStoppedHours(source.getPlannedStoppedHours())
                .plannedStoppedMinutes(source.getPlannedStoppedMinutes())
                .status(MaintenancePlanStatus.PLANNED)
                .build();

        source.getAssignees().forEach(assignee ->
                nextPlan.getAssignees().add(
                        MaintenancePlanAssignee.builder()
                                .maintenancePlan(nextPlan)
                                .user(assignee.getUser())
                                .team(assignee.getTeam())
                                .build()
                )
        );

        source.getSpareParts().forEach(item ->
                nextPlan.getSpareParts().add(
                        MaintenancePlanSparePart.builder()
                                .maintenancePlan(nextPlan)
                                .sparePart(item.getSparePart())
                                .quantity(item.getQuantity())
                                .build()
                )
        );

        return nextPlan;
    }

    private String getOccurrenceKey(MaintenancePlan plan) {
        Long equipmentId = plan.getEquipment() != null ? plan.getEquipment().getId() : null;

        return String.join(
                "|",
                String.valueOf(equipmentId),
                String.valueOf(plan.getDescription()),
                String.valueOf(plan.getTriggerType()),
                String.valueOf(plan.getFrequencyValue()),
                String.valueOf(plan.getFrequencyUnit()),
                String.valueOf(plan.getNextDueDate())
        );
    }

    private String getTriggerLabel(MaintenancePlan plan) {
        if (plan.getTriggerType() == MaintenanceTriggerType.FIXED_DATE) {
            if (plan.getFrequencyValue() == 1 && "WEEKS".equals(plan.getFrequencyUnit())) {
                return "Hebdomadaire";
            }
            if (plan.getFrequencyValue() == 1 && "MONTHS".equals(plan.getFrequencyUnit())) {
                return "Mensuel";
            }
            if (plan.getFrequencyValue() == 3 && "MONTHS".equals(plan.getFrequencyUnit())) {
                return "Trimestriel";
            }
            if (plan.getFrequencyValue() == 1 && "YEARS".equals(plan.getFrequencyUnit())) {
                return "Annuel";
            }
            return "Date fixe";
        }

        return "Date fixe";
    }
    private String getFrequencyLabel(MaintenancePlan plan) {
        String unit = switch (plan.getFrequencyUnit()) {
            case "DAYS" -> "jours";
            case "WEEKS" -> "semaines";
            case "MONTHS" -> "mois";
            case "YEARS" -> "ans";
            default -> plan.getFrequencyUnit();
        };

        return "Tous les " + plan.getFrequencyValue() + " " + unit;
    }
}
