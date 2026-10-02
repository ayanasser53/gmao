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

    @Query("select count(p) from MaintenancePlan p where p.equipment.usine.id = :usineId")
    long countByUsineId(@Param("usineId") Long usineId);

    @Query("select p from MaintenancePlan p where p.id = :id and p.equipment.usine.id = :usineId")
    Optional<MaintenancePlan> findByIdAndUsineId(@Param("id") Long id, @Param("usineId") Long
     usineId);
     @Query(
            "select distinct p from MaintenancePlan p "
                    + "join p.assignees a "
                    + "where a.user.id = :userId and p.equipment.usine.id = :usineId"
    )
    List<MaintenancePlan> findMineByAssigneeIdAndUsineId(
            @Param("userId") Long userId,
            @Param("usineId") Long usineId
    );

    /**
     * Plans de maintenance où l'utilisateur est affecté, toutes usines
     * confondues. Utilisé par le portail prestataire.
     */
    @Query(
            "select distinct p from MaintenancePlan p "
                    + "join p.assignees a "
                    + "where a.user.id = :userId"
    )
    List<MaintenancePlan> findMineByAssigneeId(@Param("userId") Long userId);

    @Query(
            "select distinct p from MaintenancePlan p "
                    + "join p.assignees a "
                    + "where p.id = :id and a.user.id = :userId"
    )
    Optional<MaintenancePlan> findByIdAssignedToUser(
            @Param("id") Long id,
            @Param("userId") Long userId
    );

    @Query(
            "select p from MaintenancePlan p "
                    + "where p.equipment.id = :equipmentId "
                    + "and p.equipment.usine.id = :usineId "
                    + "and p.equipmentOnly = :equipmentOnly "
                    + "and p.description = :description "
                    + "and p.regulatory = :regulatory "
                    + "and p.triggerType = :triggerType "
                    + "and p.frequencyValue = :frequencyValue "
                    + "and p.frequencyUnit = :frequencyUnit "
                    + "and p.plannedMaintenanceHours = :plannedMaintenanceHours "
                    + "and p.plannedMaintenanceMinutes = :plannedMaintenanceMinutes "
                    + "and p.plannedStoppedHours = :plannedStoppedHours "
                    + "and p.plannedStoppedMinutes = :plannedStoppedMinutes"
    )
    List<MaintenancePlan> findSeriesBySignature(
            @Param("equipmentId") Long equipmentId,
            @Param("usineId") Long usineId,
            @Param("equipmentOnly") boolean equipmentOnly,
            @Param("description") String description,
            @Param("regulatory") boolean regulatory,
            @Param("triggerType") MaintenanceTriggerType triggerType,
            @Param("frequencyValue") int frequencyValue,
            @Param("frequencyUnit") String frequencyUnit,
            @Param("plannedMaintenanceHours") int plannedMaintenanceHours,
            @Param("plannedMaintenanceMinutes") int plannedMaintenanceMinutes,
            @Param("plannedStoppedHours") int plannedStoppedHours,
            @Param("plannedStoppedMinutes") int plannedStoppedMinutes
    );
}
