package com.gmao.gmao_backend.task;

public record TaskAssigneeResponse(
        Long id,
        String type,
        Long userId,
        String userFullName,
        String userPhoto,
        Long teamId,
        String teamName
) {
}
