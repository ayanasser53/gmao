package com.gmao.gmao_backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

   List<Task> findAllByOrderByCreatedAtDesc();

    @Query("select t from Task t where t.equipment.usine.id = :usineId order by t.createdAt desc")
    List<Task> findAllByUsineIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("usineId") Long usineId);

    @Query("select count(t) from Task t where t.equipment.usine.id = :usineId")
    long countByUsineId(@org.springframework.data.repository.query.Param("usineId") Long usineId);

    @Query("select t from Task t where t.id = :id and t.equipment.usine.id = :usineId")
    java.util.Optional<Task> findByIdAndUsineId(
            @org.springframework.data.repository.query.Param("id") Long id,
            @org.springframework.data.repository.query.Param("usineId") Long usineId
    );

    List<Task> findAllByCreatedByIdOrderByCreatedAtDesc(Long createdById);

    boolean existsByEquipmentId(Long equipmentId);

    /**
     * Tâches affectées à un utilisateur pour exécution (champ assignedTo
     * uniquement — pas le champ "assignees", qui identifie le
     * signaleur/rapporteur de la tâche), quelle que soit l'usine. Utilisé
     * par le portail prestataire/opérateur pour l'onglet "Tâches
     * assignées", distinct de "Tâches créées" (qui utilise createdBy).
     */
    @Query(
            "select distinct t from Task t " +
                    "left join t.assignedTo at " +
                    "where at.user.id = :userId " +
                    "order by t.createdAt desc"
    )
    List<Task> findAllAssignedToUserOrderByCreatedAtDesc(
            @org.springframework.data.repository.query.Param("userId") Long userId
    );

    @Query(
            "select distinct t from Task t " +
                    "left join t.assignedTo at " +
                    "where t.id = :id and at.user.id = :userId"
    )
    java.util.Optional<Task> findByIdAssignedToUser(
            @org.springframework.data.repository.query.Param("id") Long id,
            @org.springframework.data.repository.query.Param("userId") Long userId
    );

    @Query(
            "SELECT COALESCE(SUM(t.plannedMaintenanceHours * 60 + t.plannedMaintenanceMinutes), 0) " +
                    "FROM Task t WHERE t.equipment.usine.id = :usineId"
    )
    long sumPlannedMaintenanceMinutes(@org.springframework.data.repository.query.Param("usineId") Long usineId);
}