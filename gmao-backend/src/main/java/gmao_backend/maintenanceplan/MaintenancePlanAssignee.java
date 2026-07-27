package com.gmao.gmao_backend.maintenanceplan;

import com.gmao.gmao_backend.team.Team;
import com.gmao.gmao_backend.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "maintenance_plan_assignees",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_mpa_plan_user",
                columnNames = {"maintenance_plan_id", "user_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maintenance_plan_id", nullable = false)
    private MaintenancePlan maintenancePlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}
