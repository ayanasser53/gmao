package com.gmao.gmao_backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findAllByOrderByPerformedDateDescPerformedEndTimeDesc();

    List<Activity> findByStatusOrderByPerformedDateDescPerformedEndTimeDesc(ActivityStatus status);

    List<Activity> findByTaskIdOrderByPerformedDateDescPerformedEndTimeDesc(Long taskId);

    @Query("select a from Activity a where a.task.equipment.usine.id = :usineId order by a.performedDate desc, a.performedEndTime desc")
    List<Activity> findAllByUsineIdOrderByPerformedDateDesc(@Param("usineId") Long usineId);

    @Query("select a from Activity a where a.status = :status and a.task.equipment.usine.id = :usineId order by a.performedDate desc, a.performedEndTime desc")
    List<Activity> findByStatusAndUsineId(@Param("status") ActivityStatus status, @Param("usineId") Long usineId);

    @Query("select a from Activity a where a.task.id = :taskId and a.task.equipment.usine.id = :usineId order by a.performedDate desc, a.performedEndTime desc")
    List<Activity> findByTaskIdAndUsineId(@Param("taskId") Long taskId, @Param("usineId") Long usineId);

    @Query("select a from Activity a where a.id = :id and a.task.equipment.usine.id = :usineId")
    Optional<Activity> findByIdAndUsineId(@Param("id") Long id, @Param("usineId") Long usineId);

    @Query("""
            select distinct activity
            from Activity activity
            join ActivityIntervenant intervenant
                on intervenant.activity = activity
            where intervenant.user.id = :userId
                and activity.task.equipment.usine.id = :usineId
            order by activity.performedDate desc, activity.performedEndTime desc
            """)
    List<Activity> findMineByIntervenantIdAndUsineId(
            @Param("userId") Long userId,
            @Param("usineId") Long usineId
    );

    /**
     * Activités où l'utilisateur est intervenant, toutes usines confondues.
     * Utilisé par le portail prestataire, qui peut intervenir sur
     * plusieurs usines.
     */
    @Query("""
            select distinct activity
            from Activity activity
            join ActivityIntervenant intervenant
                on intervenant.activity = activity
            where intervenant.user.id = :userId
            order by activity.performedDate desc, activity.performedEndTime desc
            """)
    List<Activity> findMineByIntervenantId(@Param("userId") Long userId);
}
