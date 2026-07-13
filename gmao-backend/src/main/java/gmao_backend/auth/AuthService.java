package com.gmao.gmao_backend.auth;

import com.gmao.gmao_backend.exception.AccountDisabledException;
import com.gmao.gmao_backend.exception.EmailAlreadyExistsException;
import com.gmao.gmao_backend.exception.InvalidCredentialsException;
import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .phone(normalizeOptionalValue(request.getPhone()))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                "Compte créé avec succès. Vous pouvez maintenant vous connecter.",
                savedUser.getId(),
                savedUser.getEmail()
        );
    }

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
                user.getRole().name()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}