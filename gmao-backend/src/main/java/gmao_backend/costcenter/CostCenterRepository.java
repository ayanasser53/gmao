package com.gmao.gmao_backend.costcenter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CostCenterRepository
        extends JpaRepository<CostCenter, Long> {

    List<CostCenter> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(
            String name,
            Long id
    );
}