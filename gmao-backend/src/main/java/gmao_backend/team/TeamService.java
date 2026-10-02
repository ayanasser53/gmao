package com.gmao.gmao_backend.team;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagRepository;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.usine.Usine;
import com.gmao.gmao_backend.usine.UsineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final UsineRepository usineRepository;
    private final CurrentUserProvider currentUserProvider;

    public List<TeamResponse> findAll() {
        return teamRepository.findAllByUsineId(currentUserProvider.requireUsineId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TeamResponse findById(Long id) {
        return toResponse(getTeam(id));
    }

    @Transactional
    public TeamResponse create(TeamRequest request) {
        Usine usine = usineRepository.getReferenceById(currentUserProvider.requireUsineId());

        Team team = Team.builder()
                .name(request.name().trim())
                .description(request.description())
                .usine(usine)
                .tags(resolveTags(request.tagIds()))
                .active(true)
                .build();

        Team savedTeam = teamRepository.save(team);
        syncMembers(savedTeam, request.memberIds());

        return toResponse(savedTeam);
    }

    @Transactional
    public TeamResponse update(Long id, TeamRequest request) {
        Team team = getTeam(id);

        team.setName(request.name().trim());
        team.setDescription(request.description());
        team.setTags(resolveTags(request.tagIds()));

        teamRepository.save(team);
        syncMembers(team, request.memberIds());

        return toResponse(team);
    }

    @Transactional
    public void delete(Long id) {
        Team team = getTeam(id);

        for (User member : userRepository.findAllByUsineId(currentUserProvider.requireUsineId())) {
            if (member.getTeams().remove(team)) {
                userRepository.save(member);
            }
        }

        teamRepository.delete(team);
    }

    @Transactional
    public TeamResponse setActive(Long id, boolean active) {
        Team team = getTeam(id);
        team.setActive(active);

        return toResponse(teamRepository.save(team));
    }

    private void syncMembers(Team team, List<Long> memberIds) {
        Set<Long> targetIds = memberIds == null
                ? new HashSet<>()
                : new HashSet<>(memberIds);

        for (User user : userRepository.findAllByUsineId(currentUserProvider.requireUsineId())) {
            boolean shouldBeMember = targetIds.contains(user.getId());
            boolean isMember = user.getTeams().contains(team);

            if (shouldBeMember && !Boolean.TRUE.equals(user.getActive())) {
                throw new IllegalArgumentException("Un utilisateur inactif ne peut pas etre ajoute a une equipe.");
            }

            if (shouldBeMember && !isMember) {
                user.getTeams().add(team);
                userRepository.save(user);
            } else if (!shouldBeMember && isMember) {
                user.getTeams().remove(team);
                userRepository.save(user);
            }
        }
    }

    private Set<Tag> resolveTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new HashSet<>();
        }

        return new HashSet<>(tagRepository.findAllById(tagIds));
    }

    private Team getTeam(Long id) {
        return teamRepository.findByIdAndUsineId(id, currentUserProvider.requireUsineId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipe introuvable."));
    }

    private TeamResponse toResponse(Team team) {
        List<TeamResponse.TeamMemberSummary> members = team.getMembers()
                .stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .map(user -> new TeamResponse.TeamMemberSummary(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail()
                ))
                .toList();

        List<TeamResponse.TeamTagSummary> tags = team.getTags()
                .stream()
                .map(tag -> new TeamResponse.TeamTagSummary(tag.getId(), tag.getName(), tag.getColor()))
                .toList();

        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getDescription(),
                Boolean.TRUE.equals(team.getActive()),
                members,
                tags,
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }
}
