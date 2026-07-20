package com.gmao.gmao_backend.activity;

public record ActivityIntervenantResponse(
        Long userId,
        String firstName,
        String lastName,
        String email
) {
}