package com.gmao.gmao_backend.user;

import com.gmao.gmao_backend.exception.EmailAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;

import lombok.RequiredArgsConstructor;

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
    private final PasswordEncoder passwordEncoder;

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public List<UserDetailResponse> findAllDetailed() {
        return userRepository.findAll()
                .stream()
                .map(this::toDetailResponse)
                .toList();
    }

    @Transactional
    public UserDetailResponse invite(UserRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(generateTempPassword()))
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
                user.getPhoto(),
                user.getRole(),
                user.getHourlyRate(),
                Boolean.TRUE.equals(user.getActive()),
                teams,
                tags
        );
    }
}
