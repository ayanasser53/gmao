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
    private final UsineRepository usineRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public List<UserDetailResponse> findAllDetailed() {
        User currentUser = currentUserProvider.getUser();

        List<User> users = currentUser.getRole() == Role.SUPERADMIN
                ? userRepository.findAll()
                : userRepository.findAllByUsineId(currentUserProvider.requireUsineId());

        return users.stream()
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

<<<<<<< HEAD
        if (request.password() == null || request.password().length() < 6) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins 6 caracteres.");
        }
=======
        String temporaryPassword = generateTempPassword();
>>>>>>> 9ee36af (ajout separation par usine)

        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(normalizedEmail)
<<<<<<< HEAD
                .phone(normalizeNullable(request.phone()))
                .password(passwordEncoder.encode(request.password()))
                .role(request.role() == null ? Role.TECHNICIAN : request.role())
=======
                .password(passwordEncoder.encode(temporaryPassword))
                .role(targetRole)
>>>>>>> 9ee36af (ajout separation par usine)
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
<<<<<<< HEAD
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
=======
        user.setRole(newRole);
>>>>>>> 9ee36af (ajout separation par usine)
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

    /**
     * Détermine l'usine à laquelle rattacher un nouvel utilisateur, selon
     * qui crée le compte :
     * - un ADMIN ne peut créer que des utilisateurs de SA propre usine.
     * - un SUPERADMIN doit obligatoirement préciser l'usine cible.
     */
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

        // Un ADMIN (ou autre rôle habilité) crée toujours dans sa propre usine.
        Long ownUsineId = currentUserProvider.requireUsineId();

        return usineRepository.findById(ownUsineId)
                .orElseThrow(() -> new ResourceNotFoundException("Usine introuvable."));
    }

    /**
     * Récupère un utilisateur en vérifiant que l'appelant a le droit de le voir/modifier :
     * un SUPERADMIN peut tout, un ADMIN uniquement les membres de sa propre usine.
     */
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
