package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivitySparePartRepository extends JpaRepository<ActivitySparePart, ActivitySparePartId> {
    List<ActivitySparePart> findByActivityId(Long activityId);
    void deleteByActivityId(Long activityId);
}