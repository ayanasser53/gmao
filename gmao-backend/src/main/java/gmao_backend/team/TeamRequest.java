package com.gmao.gmao_backend.team;

import java.util.List;

public record TeamRequest(
        String name,
        String description,
        List<Long> memberIds,
        List<Long> tagIds
) {
}
