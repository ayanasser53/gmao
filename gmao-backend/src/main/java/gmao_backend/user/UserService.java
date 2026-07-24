package com.gmao.gmao_backend.user;

import com.gmao.gmao_backend.exception.EmailAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDetailResponse> findAllDetailed() {
        return userRepository.findAll()
                .stream()
                .map(this::toDetailResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse findCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Utilisateur connecte introuvable.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur connecte introuvable."));

        return toDetailResponse(user);
    }

    @Transactional
    public UserDetailResponse invite(UserRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        if (request.password() == null || request.password().length() < 6) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins 6 caracteres.");
        }

        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(normalizedEmail)
                .phone(normalizeNullable(request.phone()))
                .password(passwordEncoder.encode(request.password()))
                .role(request.role() == null ? Role.TECHNICIAN : request.role())
                .hourlyRate(request.hourlyRate())
                .active(true)
                .tags(resolveTags(request.tagIds()))
                .build();

        return toDetailResponse(userRepository.save(user));
    }

    @Transactional
    public UserDetailResponse update(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collegue introuvable."));

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(normalizedEmail);
        if (request.phone() != null) {
            user.setPhone(normalizeNullable(request.phone()));
        }
        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 6) {
                throw new IllegalArgumentException("Le mot de passe doit contenir au moins 6 caracteres.");
            }

            user.setPassword(passwordEncoder.encode(request.password()));
        }
        user.setRole(request.role() == null ? user.getRole() : request.role());
        user.setHourlyRate(request.hourlyRate());
        user.setTags(resolveTags(request.tagIds()));

        return toDetailResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collegue introuvable."));

        userRepository.delete(user);
    }

    private Set<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new HashSet<>();
        }

        return new HashSet<>(tagRepository.findAllById(tagIds));
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private UserDetailResponse toDetailResponse(User user) {
        List<UserDetailResponse.UserTeamSummary> teams = user.getTeams()
                .stream()
                .map(team -> new UserDetailResponse.UserTeamSummary(team.getId(), team.getName()))
                .toList();

        List<UserDetailResponse.UserTagSummary> tags = user.getTags()
                .stream()
                .map(tag -> new UserDetailResponse.UserTagSummary(tag.getId(), tag.getName(), tag.getColor()))
                .toList();

        return new UserDetailResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getPhoto(),
                user.getRole(),
                user.getHourlyRate(),
                Boolean.TRUE.equals(user.getActive()),
                teams,
                tags
        );
    }
}
