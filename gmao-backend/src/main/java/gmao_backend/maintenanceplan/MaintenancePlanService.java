package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final EquipmentRepository equipmentRepository;

    public List<MaintenancePlanResponse> findAll() {
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
                .status(resolveStatus(request.nextDueDate()))
                .build();

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
        plan.setStatus(resolveStatus(plan.getNextDueDate()));

        return toResponse(maintenancePlanRepository.save(plan));
    }

    public void delete(Long id) {
        maintenancePlanRepository.deleteById(id);
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
                getTriggerLabel(plan.getTriggerType()),
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
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private LocalDate resolveNextDueDate(MaintenancePlanRequest request) {
        if (request.nextDueDate() != null) {
            return request.nextDueDate();
        }

        return request.startDate();
    }

    private MaintenancePlanStatus resolveStatus(LocalDate nextDueDate) {
        if (nextDueDate != null && nextDueDate.isBefore(LocalDate.now())) {
            return MaintenancePlanStatus.LATE;
        }

        return MaintenancePlanStatus.IN_PROGRESS;
    }

    private String getTriggerLabel(MaintenanceTriggerType triggerType) {
        return switch (triggerType) {
            case FIXED_DATE -> "Date fixe";
            case TASK_CLOSURE -> "Clôture de la tâche";
            case EXTERNAL_API -> "Déclencheur externe (API)";
            case COUNTER -> "Déclenché par un compteur";
        };
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