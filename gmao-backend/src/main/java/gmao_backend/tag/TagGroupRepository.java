package com.gmao.gmao_backend.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagGroupRepository
        extends JpaRepository<TagGroup, Long> {

    List<TagGroup> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(
            String name,
            Long id
    );
}