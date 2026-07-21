package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.tag.Tag;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;
import com.gmao.gmao_backend.activity.Activity;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipment_only", nullable = false)
    @Builder.Default
    private boolean equipmentOnly = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "all_day", nullable = false)
    @Builder.Default
    private boolean allDay = false;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "start_hour")
    private LocalTime startHour;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "end_hour")
    private LocalTime endHour;

    @Column(name = "planned_maintenance_hours", nullable = false)
    @Builder.Default
    private int plannedMaintenanceHours = 0;

    @Column(name = "planned_maintenance_minutes", nullable = false)
    @Builder.Default
    private int plannedMaintenanceMinutes = 0;

    @Column(name = "planned_stopped_hours", nullable = false)
    @Builder.Default
    private int plannedStoppedHours = 0;

    @Column(name = "planned_stopped_minutes", nullable = false)
    @Builder.Default
    private int plannedStoppedMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.IN_PROGRESS;

    /*
     * Assignees (users or teams)
     */

    @OneToMany(
            mappedBy = "task",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<TaskAssignee> assignees = new LinkedHashSet<>();

    /*
     * Assigned to (who performs the task — users or teams)
     */

    @OneToMany(
            mappedBy = "task",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<TaskAssignedTo> assignedTo = new LinkedHashSet<>();

    /*
     * Documents
     */

    @OneToMany(
            mappedBy = "task",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<TaskDocument> documents = new LinkedHashSet<>();

    /*
     * Spare parts to provide
     */

    @OneToMany(
            mappedBy = "task",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<TaskSparePart> spareParts = new LinkedHashSet<>();

    /*
     * Tags
     */

    @ManyToMany
    @JoinTable(
            name = "task_tags",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    /*
     * Dates
     */

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

@OneToMany(
        mappedBy = "task",
        cascade = CascadeType.ALL,
        orphanRemoval = true
)
@Builder.Default
private Set<Activity> activities = new LinkedHashSet<>();
}
