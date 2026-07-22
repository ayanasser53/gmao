package com.gmao.gmao_backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface TaskSparePartRepository extends JpaRepository<TaskSparePart, TaskSparePartId> {

    @Modifying
    @Transactional
    @Query("delete from TaskSparePart tsp where tsp.task.id = :taskId")
    void deleteAllByTaskId(Long taskId);
}