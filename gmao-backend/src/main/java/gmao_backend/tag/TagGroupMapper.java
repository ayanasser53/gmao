package com.gmao.gmao_backend.tag;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TagGroupMapper {

    private final TagMapper tagMapper;

    public TagGroupResponse toResponse(TagGroup group) {
        return new TagGroupResponse(
                group.getId(),
                group.getName(),
                group.isSingleChoice(),
                group.isMandatory(),
                group.getTags()
                        .stream()
                        .map(tagMapper::toResponse)
                        .toList(),
                group.getCreatedAt(),
                group.getUpdatedAt()
        );
    }
}