package com.gmao.gmao_backend.sparepart;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "spare_part_stock_movements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SparePartStockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spare_part_id", nullable = false)
    private SparePart sparePart;

    @Column(nullable = false)
    private String source;

    private String reference;

    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "task_description")
    private String taskDescription;

    @Column(name = "activity_id")
    private Long activityId;

    @Column(name = "activity_description")
    private String activityDescription;

    @Column(name = "maintenance_plan_id")
    private Long maintenancePlanId;

    @Column(name = "maintenance_plan_description")
    private String maintenancePlanDescription;

    @Column(name = "movement_type", nullable = false)
    private String movementType;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "movement_date", nullable = false)
    private LocalDateTime movementDate;
}