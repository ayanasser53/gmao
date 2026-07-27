package com.gmao.gmao_backend.config;

import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crée automatiquement un compte SUPERADMIN au premier démarrage de
 * l'application, s'il n'en existe encore aucun (puisque l'inscription
 * publique a été supprimée : c'est le SUPERADMIN qui crée ensuite les
 * usines et leurs administrateurs).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class SuperAdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.email}")
    private String superAdminEmail;

    @Value("${app.superadmin.password}")
    private String superAdminPassword;

    @Value("${app.superadmin.first-name}")
    private String superAdminFirstName;

    @Value("${app.superadmin.last-name}")
    private String superAdminLastName;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByRole(Role.SUPERADMIN)) {
            return;
        }

        User superAdmin = User.builder()
                .firstName(superAdminFirstName)
                .lastName(superAdminLastName)
                .email(superAdminEmail.trim().toLowerCase())
                .password(passwordEncoder.encode(superAdminPassword))
                .role(Role.SUPERADMIN)
                .active(true)
                .usine(null)
                .build();

        userRepository.save(superAdmin);

        log.warn(
                "==> Compte SUPERADMIN créé automatiquement : {} / (mot de passe défini dans app.superadmin.password). "
                        + "Changez ce mot de passe dès la première connexion.",
                superAdminEmail
        );
    }
}
