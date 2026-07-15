package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findAllByOrderByPerformedDateDescPerformedEndTimeDesc();

    List<Activity> findByStatusOrderByPerformedDateDescPerformedEndTimeDesc(ActivityStatus status);

    List<Activity> findByTaskIdOrderByPerformedDateDescPerformedEndTimeDesc(Long taskId);
}
