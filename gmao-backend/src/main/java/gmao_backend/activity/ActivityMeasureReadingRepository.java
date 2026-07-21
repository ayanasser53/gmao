package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityMeasureReadingRepository extends JpaRepository<ActivityMeasureReading, Long> {
    List<ActivityMeasureReading> findByActivityId(Long activityId);
    void deleteByActivityId(Long activityId);
}
