package com.gmao.gmao_backend.tag;

import java.time.LocalDateTime;

public record TagResponse(
        Long id,
        String name,
        String code,
        String color,
        Long groupId,
        String groupName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}