package com.gmao.gmao_backend.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository
        extends JpaRepository<Tag, Long> {

    List<Tag> findAllByUsineIdOrderByNameAsc(Long usineId);

    Optional<Tag> findByIdAndUsineId(Long id, Long usineId);

    List<Tag> findAllByGroupId(Long groupId);

    boolean existsByNameIgnoreCaseAndUsineId(String name, Long usineId);

    boolean existsByNameIgnoreCaseAndUsineIdAndIdNot(
            String name,
            Long usineId,
            Long id
    );

    boolean existsByCodeIgnoreCaseAndUsineId(String code, Long usineId);

    boolean existsByCodeIgnoreCaseAndUsineIdAndIdNot(
            String code,
            Long usineId,
            Long id
    );

    List<Tag> findAllByUsineIdIsNull();
}
