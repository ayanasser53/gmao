package com.gmao.gmao_backend.auth;

public record RegisterResponse(
        String message,
        Long userId,
        String email
) {
}