package com.gmao.gmao_backend.task;

public record AssigneeRequest(
        Long userId,
        Long teamId
) {
}
