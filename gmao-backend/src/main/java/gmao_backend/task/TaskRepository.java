package com.gmao.gmao_backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

   List<Task> findAllByOrderByCreatedAtDesc();

    List<Task> findAllByCreatedByIdOrderByCreatedAtDesc(Long createdById);

    boolean existsByEquipmentId(Long equipmentId);

    @Query(
            "SELECT COALESCE(SUM(t.plannedMaintenanceHours * 60 + t.plannedMaintenanceMinutes), 0) " +
                    "FROM Task t"
    )
    long sumPlannedMaintenanceMinutes();
}
