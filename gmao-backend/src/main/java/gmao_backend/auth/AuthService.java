package com.gmao.gmao_backend.auth;

import com.gmao.gmao_backend.exception.AccountDisabledException;
import com.gmao.gmao_backend.exception.InvalidCredentialsException;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // L'inscription publique a été supprimée : les usines et leurs
    // administrateurs sont désormais créés uniquement par un SUPERADMIN
    // (voir UsineService / UserService).

    public AuthResponse login(LoginRequest request) {

        String normalizedEmail = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new AccountDisabledException();
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getUsine() != null ? user.getUsine().getId() : null,
                user.getUsine() != null ? user.getUsine().getName() : null
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}