package com.gmao.gmao_backend.tag;

import java.time.LocalDateTime;
import java.util.List;

public record TagGroupResponse(
        Long id,
        String name,
        boolean singleChoice,
        boolean mandatory,
        List<TagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}