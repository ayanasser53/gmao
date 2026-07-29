package com.gmao.gmao_backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findAllByUsineId(Long usineId);

    Optional<User> findByIdAndUsineId(Long id, Long usineId);

    long countByUsineId(Long usineId);

    boolean existsByRole(Role role);

    List<User> findAllByUsineIdAndRole(Long usineId, Role role);

    List<User> findAllByRole(Role role);
}