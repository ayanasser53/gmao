package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityAdditionalCostRepository extends JpaRepository<ActivityAdditionalCost, Long> {
    List<ActivityAdditionalCost> findByActivityId(Long activityId);
    void deleteByActivityId(Long activityId);
}