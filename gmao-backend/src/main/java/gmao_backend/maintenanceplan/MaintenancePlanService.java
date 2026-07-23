package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

    public List<MaintenancePlanResponse> findAll() {
        ensureDueOccurrences();

        return maintenancePlanRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MaintenancePlanResponse findById(Long id) {
        MaintenancePlan plan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));

        return toResponse(plan);
    }

    public MaintenancePlanResponse create(MaintenancePlanRequest request) {
        Equipment equipment = equipmentRepository.findById(request.equipmentId())
                .orElseThrow(() -> new RuntimeException("Équipement introuvable"));

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
        return toResponse(maintenancePlanRepository.save(plan));
    }

    public MaintenancePlanResponse update(Long id, MaintenancePlanRequest request) {
        MaintenancePlan plan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));

        Equipment equipment = equipmentRepository.findById(request.equipmentId())
                .orElseThrow(() -> new RuntimeException("Équipement introuvable"));

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
        plan.setStatus(resolveSavedStatus(request.status()));
        applySpareParts(plan, request.spareParts());

        return toResponse(maintenancePlanRepository.save(plan));
    }

    public MaintenancePlanResponse updateStatus(Long id, MaintenancePlanStatus status) {
        MaintenancePlan plan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan de maintenance introuvable"));

        plan.setStatus(resolveSavedStatus(status));
        return toResponse(maintenancePlanRepository.save(plan));
    }

    public void delete(Long id) {
        maintenancePlanRepository.deleteById(id);
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
                    .orElseThrow(() -> new RuntimeException("Pièce détachée introuvable"));

            plan.getSpareParts().add(
                    MaintenancePlanSparePart.builder()
                            .maintenancePlan(plan)
                            .sparePart(sparePart)
                            .quantity(Math.max(1, item.quantity()))
                            .build()
            );
        }
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
                plan.getCreatedAt(),
                plan.getUpdatedAt()
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

    private void ensureDueOccurrences() {
        List<MaintenancePlan> existingPlans = maintenancePlanRepository.findAll();
        Set<String> existingKeys = new HashSet<>(
                existingPlans.stream()
                        .map(this::getOccurrenceKey)
                        .toList()
        );
        List<MaintenancePlan> plansToCreate = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (MaintenancePlan source : existingPlans) {
            if (!isRecurringPlan(source) || source.getNextDueDate() == null) {
                continue;
            }

            LocalDate nextDate = addInterval(
                    source.getNextDueDate(),
                    source.getFrequencyValue(),
                    source.getFrequencyUnit()
            );
            int guard = 0;

            while (!nextDate.isAfter(today) && guard < 366) {
                MaintenancePlan nextPlan = copyForOccurrence(source, nextDate);
                String key = getOccurrenceKey(nextPlan);

                if (!existingKeys.contains(key)) {
                    existingKeys.add(key);
                    plansToCreate.add(nextPlan);
                }

                nextDate = addInterval(nextDate, source.getFrequencyValue(), source.getFrequencyUnit());
                guard++;
            }
        }

        if (!plansToCreate.isEmpty()) {
            maintenancePlanRepository.saveAll(plansToCreate);
        }
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
