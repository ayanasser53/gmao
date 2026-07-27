package com.gmao.gmao_backend.usine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsineRepository extends JpaRepository<Usine, Long> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Usine> findByNameIgnoreCase(String name);
}
