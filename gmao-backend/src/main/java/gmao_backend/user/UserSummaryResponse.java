package com.gmao.gmao_backend.user;

public record UserSummaryResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String photo,
        boolean active
) {
}
