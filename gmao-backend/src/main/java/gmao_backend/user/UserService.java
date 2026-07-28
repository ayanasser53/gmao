package com.gmao.gmao_backend.user;

import com.gmao.gmao_backend.exception.EmailAlreadyExistsException;
import com.gmao.gmao_backend.exception.InvalidRequestException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;
import com.gmao.gmao_backend.usine.Usine;
import com.gmao.gmao_backend.usine.UsineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final UsineRepository usineRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional(readOnly = true)
    public List<UserDetailResponse> findAllDetailed() {
        Long usineId = currentUserProvider.getUsineIdOrNull();

        List<User> users = usineId == null
                ? userRepository.findAll()
                : userRepository.findAllByUsineId(usineId);

        return users.stream()
                .map(this::toDetailResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse findCurrentUser() {
        User currentUser = currentUserProvider.getUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        return toDetailResponse(user);
    }

    @Transactional
    public UserInviteResponse invite(UserRequest request) {
        User currentUser = currentUserProvider.getUser();

        Role targetRole = request.role() == null ? Role.TECHNICIAN : request.role();

        if (targetRole == Role.SUPERADMIN) {
            throw new InvalidRequestException(
                    "Un compte SUPERADMIN ne peut pas être créé depuis cet écran."
            );
        }

        Usine usine = resolveUsineForCreation(currentUser, request.usineId());

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        // Si un mot de passe a été fourni manuellement dans le formulaire, on
        // l'utilise ; sinon on en génère un temporaire automatiquement.
        String temporaryPassword = null;
        String rawPassword;

        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 6) {
                throw new IllegalArgumentException("Le mot de passe doit contenir au moins 6 caractères.");
            }
            rawPassword = request.password();
        } else {
            temporaryPassword = generateTempPassword();
            rawPassword = temporaryPassword;
        }

        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(normalizedEmail)
                .phone(normalizeNullable(request.phone()))
                .password(passwordEncoder.encode(rawPassword))
                .role(targetRole)
                .hourlyRate(request.hourlyRate())
                .active(true)
                .usine(usine)
                .tags(resolveTags(request.tagIds()))
                .build();

        User savedUser = userRepository.save(user);

        return new UserInviteResponse(
                toDetailResponse(savedUser),
                temporaryPassword
        );
    }

    @Transactional
    public UserDetailResponse update(Long id, UserRequest request) {
        User user = findAccessibleUser(id);

        Role newRole = request.role() == null ? user.getRole() : request.role();

        if (newRole == Role.SUPERADMIN && user.getRole() != Role.SUPERADMIN) {
            throw new InvalidRequestException(
                    "Un compte SUPERADMIN ne peut pas être créé depuis cet écran."
            );
        }

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        // Un SUPERADMIN peut ré-affecter un utilisateur à une autre usine.
        if (currentUserProvider.isSuperAdmin() && request.usineId() != null) {
            user.setUsine(usineRepository.findById(request.usineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usine introuvable.")));
        }

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(normalizedEmail);

        if (request.phone() != null) {
            user.setPhone(normalizeNullable(request.phone()));
        }

        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 6) {
                throw new IllegalArgumentException("Le mot de passe doit contenir au moins 6 caractères.");
            }

            user.setPassword(passwordEncoder.encode(request.password()));
        }

        user.setRole(newRole);
        user.setHourlyRate(request.hourlyRate());
        user.setTags(resolveTags(request.tagIds()));

        return toDetailResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        User user = findAccessibleUser(id);

        if (user.getId().equals(currentUserProvider.getUser().getId())) {
            throw new InvalidRequestException("Vous ne pouvez pas supprimer votre propre compte.");
        }

        userRepository.delete(user);
    }

    private Usine resolveUsineForCreation(User currentUser, Long requestedUsineId) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            if (requestedUsineId == null) {
                throw new InvalidRequestException(
                        "Vous devez préciser l'usine à laquelle rattacher ce compte."
                );
            }

            return usineRepository.findById(requestedUsineId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usine introuvable."));
        }

        Long ownUsineId = currentUserProvider.requireUsineId();

        return usineRepository.findById(ownUsineId)
                .orElseThrow(() -> new ResourceNotFoundException("Usine introuvable."));
    }

    private User findAccessibleUser(Long id) {
        User currentUser = currentUserProvider.getUser();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collègue introuvable."));

        if (currentUser.getRole() != Role.SUPERADMIN) {
            Long ownUsineId = currentUserProvider.requireUsineId();

            boolean sameUsine = user.getUsine() != null
                    && user.getUsine().getId().equals(ownUsineId);

            if (!sameUsine) {
                throw new AccessDeniedException("Vous ne pouvez pas gérer cet utilisateur.");
            }
        }

        return user;
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

    private String generateTempPassword() {
        StringBuilder builder = new StringBuilder(12);

        for (int i = 0; i < 12; i++) {
            builder.append(
                    TEMP_PASSWORD_CHARS.charAt(RANDOM.nextInt(TEMP_PASSWORD_CHARS.length()))
            );
        }

        return builder.toString();
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
                user.getUsine() != null ? user.getUsine().getId() : null,
                user.getUsine() != null ? user.getUsine().getName() : null,
                teams,
                tags
        );
    }
}
