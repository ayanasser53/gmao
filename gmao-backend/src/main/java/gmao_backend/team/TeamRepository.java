package com.gmao.gmao_backend.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllByUsineId(Long usineId);

    Optional<Team> findByIdAndUsineId(Long id, Long usineId);

    List<Team> findAllByUsineIdIsNull();
}
