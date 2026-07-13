package com.gmao.gmao_backend.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long userId;
    private String email;
    private String role;
}