package com.gmao.gmao_backend.tag;

import org.springframework.stereotype.Component;

@Component
public class TagMapper {

    public TagResponse toResponse(Tag tag) {

        Long groupId = null;
        String groupName = null;

        if (tag.getGroup() != null) {
            groupId = tag.getGroup().getId();
            groupName = tag.getGroup().getName();
        }

        return new TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getCode(),
                tag.getColor(),
                groupId,
                groupName,
                tag.getCreatedAt(),
                tag.getUpdatedAt()
        );
    }
}