package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.equipment.Equipment;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "maintenance_plans")
public class MaintenancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipment_only", nullable = false)
    private boolean equipmentOnly = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(name = "planned_maintenance_hours", nullable = false)
    private int plannedMaintenanceHours = 0;

    @Column(name = "planned_maintenance_minutes", nullable = false)
    private int plannedMaintenanceMinutes = 0;

    @Column(name = "planned_stopped_hours", nullable = false)
    private int plannedStoppedHours = 0;

    @Column(name = "planned_stopped_minutes", nullable = false)
    private int plannedStoppedMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenancePlanStatus status = MaintenancePlanStatus.IN_PROGRESS;

    @Column(nullable = false)
    private boolean regulatory = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private MaintenanceTriggerType triggerType = MaintenanceTriggerType.FIXED_DATE;

    @Column(name = "frequency_value", nullable = false)
    private int frequencyValue = 1;

    @Column(name = "frequency_unit", nullable = false)
    private String frequencyUnit = "DAYS";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @Column(name = "checklist_id")
    private Long checklistId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}