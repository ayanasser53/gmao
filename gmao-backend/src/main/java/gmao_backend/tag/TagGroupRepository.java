package com.gmao.gmao_backend.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagGroupRepository
        extends JpaRepository<TagGroup, Long> {

    List<TagGroup> findAllByUsineIdOrderByNameAsc(Long usineId);

    Optional<TagGroup> findByIdAndUsineId(Long id, Long usineId);

    boolean existsByNameIgnoreCaseAndUsineId(String name, Long usineId);

    boolean existsByNameIgnoreCaseAndUsineIdAndIdNot(
            String name,
            Long usineId,
            Long id
    );

    List<TagGroup> findAllByUsineIdIsNull();
}
