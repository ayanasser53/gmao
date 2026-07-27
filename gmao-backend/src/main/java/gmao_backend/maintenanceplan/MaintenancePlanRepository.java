package com.gmao.gmao_backend.maintenanceplan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaintenancePlanRepository
        extends JpaRepository<MaintenancePlan, Long> {

    @Query("select p from MaintenancePlan p where p.equipment.usine.id = :usineId")
    List<MaintenancePlan> findAllByUsineId(@Param("usineId") Long usineId);

    @Query("select p from MaintenancePlan p where p.id = :id and p.equipment.usine.id = :usineId")
    Optional<MaintenancePlan> findByIdAndUsineId(@Param("id") Long id, @Param("usineId") Long usineId);

    @Query("""
            select distinct plan
            from MaintenancePlan plan
            join plan.assignees assignee
            where assignee.user.id = :userId
                and plan.equipment.usine.id = :usineId
            order by plan.nextDueDate asc, plan.startDate asc
            """)
    List<MaintenancePlan> findMineByAssigneeIdAndUsineId(
            @Param("userId") Long userId,
            @Param("usineId") Long usineId
    );
}
