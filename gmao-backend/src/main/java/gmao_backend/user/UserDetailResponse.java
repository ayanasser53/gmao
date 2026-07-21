package com.gmao.gmao_backend.user;

import java.math.BigDecimal;
import java.util.List;

public record UserDetailResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String photo,
        Role role,
        BigDecimal hourlyRate,
        boolean active,
        List<UserTeamSummary> teams,
        List<UserTagSummary> tags
) {
    public record UserTeamSummary(Long id, String name) {
    }

    public record UserTagSummary(Long id, String name, String color) {
    }
}
