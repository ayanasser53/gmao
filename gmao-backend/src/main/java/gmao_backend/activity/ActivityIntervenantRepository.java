package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityIntervenantRepository extends JpaRepository<ActivityIntervenant, ActivityIntervenantId> {
    List<ActivityIntervenant> findByActivityId(Long activityId);
    void deleteByActivityId(Long activityId);
}