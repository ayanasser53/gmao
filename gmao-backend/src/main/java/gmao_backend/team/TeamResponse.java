package com.gmao.gmao_backend.team;

import java.time.LocalDateTime;
import java.util.List;

public record TeamResponse(
        Long id,
        String name,
        String description,
        List<TeamMemberSummary> members,
        List<TeamTagSummary> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record TeamMemberSummary(Long id, String firstName, String lastName, String email) {
    }

    public record TeamTagSummary(Long id, String name, String color) {
    }
}
