package com.gmao.gmao_backend.tag;

import com.gmao.gmao_backend.common.CodeGenerator;
import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagGroupRepository groupRepository;
    private final TagMapper tagMapper;
    private final CodeGenerator codeGenerator;

    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagRepository
                .findAllByOrderByNameAsc()
                .stream()
                .map(tagMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TagResponse findById(Long id) {
        return tagMapper.toResponse(findEntityById(id));
    }

    @Transactional
    public TagResponse create(CreateTagRequest request) {

        if (
                tagRepository.existsByNameIgnoreCase(
                        request.name().trim()
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un tag possède déjà ce nom."
            );
        }

        String code = codeGenerator.generateUniqueCode(
                request.code(),
                request.name(),
                tagRepository::existsByCodeIgnoreCase
        );

        TagGroup group = findGroup(request.groupId());

        Tag tag = Tag.builder()
                .name(request.name().trim())
                .code(code)
                .color(normalizeColor(request.color()))
                .group(group)
                .build();

        return tagMapper.toResponse(
                tagRepository.save(tag)
        );
    }

    @Transactional
    public TagResponse update(
            Long id,
            UpdateTagRequest request
    ) {
        Tag tag = findEntityById(id);

        if (
                tagRepository.existsByNameIgnoreCaseAndIdNot(
                        request.name().trim(),
                        id
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un tag possède déjà ce nom."
            );
        }

        String normalizedCode =
                codeGenerator.normalize(request.code());

        if (
                tagRepository.existsByCodeIgnoreCaseAndIdNot(
                        normalizedCode,
                        id
                )
        ) {
            throw new ResourceAlreadyExistsException(
                    "Un tag possède déjà ce code."
            );
        }

        tag.setName(request.name().trim());
        tag.setCode(normalizedCode);
        tag.setColor(normalizeColor(request.color()));
        tag.setGroup(findGroup(request.groupId()));

        return tagMapper.toResponse(
                tagRepository.save(tag)
        );
    }

    @Transactional
    public void delete(Long id) {
        Tag tag = findEntityById(id);

        try {
            tagRepository.delete(tag);
            tagRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResourceInUseException(
                    "Ce tag est utilisé et ne peut pas être supprimé."
            );
        }
    }

    @Transactional(readOnly = true)
    public Tag findEntityById(Long id) {
        return tagRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Tag introuvable."
                        )
                );
    }

    private TagGroup findGroup(Long groupId) {
        if (groupId == null) {
            return null;
        }

        return groupRepository
                .findById(groupId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Groupe de tags introuvable."
                        )
                );
    }

    private String normalizeColor(String color) {
        if (color == null || color.isBlank()) {
            return "#8A8F98";
        }

        return color.trim();
    }
}