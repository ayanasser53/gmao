package com.gmao.gmao_backend.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository
        extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderByNameAsc();

    List<Tag> findAllByGroupId(Long groupId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(
            String name,
            Long id
    );

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(
            String code,
            Long id
    );
}