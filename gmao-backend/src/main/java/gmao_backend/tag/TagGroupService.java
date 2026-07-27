package com.gmao.gmao_backend.tag;

import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.security.CurrentUserProvider;
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
public class TagGroupService {

    private final TagGroupRepository groupRepository;
    private final TagRepository tagRepository;
    private final TagGroupMapper groupMapper;
    private final UsineRepository usineRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public List<TagGroupResponse> findAll() {
        return groupRepository
                .findAllByUsineIdOrderByNameAsc(currentUserProvider.requireUsineId())
                .stream()
                .map(groupMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TagGroupResponse findById(Long id) {
        return groupMapper.toResponse(
                findEntityById(id)
        );
    }

    @Transactional
    public TagGroupResponse create(
            CreateTagGroupRequest request
    ) {
        Long usineId = currentUserProvider.requireUsineId();

        if (
                groupRepository.existsByNameIgnoreCaseAndUsineId(
                        request.name().trim(),
                        usineId
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un groupe possède déjà ce nom."
            );
        }

        Usine usine = usineRepository.getReferenceById(usineId);

        TagGroup group = TagGroup.builder()
                .name(request.name().trim())
                .singleChoice(request.singleChoice())
                .mandatory(request.mandatory())
                .usine(usine)
                .build();

        TagGroup savedGroup =
                groupRepository.save(group);

        assignTags(savedGroup, request.tagIds());

        return groupMapper.toResponse(savedGroup);
    }

    @Transactional
    public TagGroupResponse update(
            Long id,
            UpdateTagGroupRequest request
    ) {
        TagGroup group = findEntityById(id);

        if (
                groupRepository.existsByNameIgnoreCaseAndUsineIdAndIdNot(
                        request.name().trim(),
                        currentUserProvider.requireUsineId(),
                        id
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un groupe possède déjà ce nom."
            );
        }

        group.setName(request.name().trim());
        group.setSingleChoice(request.singleChoice());
        group.setMandatory(request.mandatory());

        clearCurrentTags(group);
        assignTags(group, request.tagIds());

        return groupMapper.toResponse(
                groupRepository.save(group)
        );
    }

    @Transactional
    public void delete(Long id) {
        TagGroup group = findEntityById(id);

        clearCurrentTags(group);

        groupRepository.delete(group);
    }

    private void clearCurrentTags(TagGroup group) {
        List<Tag> currentTags =
                tagRepository.findAllByGroupId(group.getId());

        currentTags.forEach(tag -> tag.setGroup(null));

        tagRepository.saveAll(currentTags);
    }

    private void assignTags(
            TagGroup group,
            Set<Long> tagIds
    ) {
        if (tagIds == null || tagIds.isEmpty()) {
            group.setTags(List.of());
            return;
        }

        List<Tag> tags = tagRepository.findAllById(
                new HashSet<>(tagIds)
        );

        if (tags.size() != tagIds.size()) {
            throw new ResourceNotFoundException(
                    "Un ou plusieurs tags sont introuvables."
            );
        }

        tags.forEach(tag -> tag.setGroup(group));

        tagRepository.saveAll(tags);
        group.setTags(tags);
    }

    private TagGroup findEntityById(Long id) {
        return groupRepository
                .findByIdAndUsineId(id, currentUserProvider.requireUsineId())
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Groupe de tags introuvable."
                        )
                );
    }
}
