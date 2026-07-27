package com.gmao.gmao_backend.usine;

import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsineService {

    private final UsineRepository usineRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UsineResponse> findAll() {
        return usineRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsineResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Transactional
    public UsineResponse create(UsineRequest request) {
        String name = request.name().trim();

        if (usineRepository.existsByNameIgnoreCase(name)) {
            throw new ResourceAlreadyExistsException(
                    "Une usine possède déjà ce nom."
            );
        }

        Usine usine = Usine.builder()
                .name(name)
                .address(blankToNull(request.address()))
                .phone(blankToNull(request.phone()))
                .email(blankToNull(request.email()))
                .active(true)
                .build();

        return toResponse(usineRepository.save(usine));
    }

    @Transactional
    public UsineResponse update(Long id, UsineRequest request) {
        Usine usine = findEntityById(id);

        String name = request.name().trim();

        usineRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResourceAlreadyExistsException(
                        "Une usine possède déjà ce nom."
                );
            }
        });

        usine.setName(name);
        usine.setAddress(blankToNull(request.address()));
        usine.setPhone(blankToNull(request.phone()));
        usine.setEmail(blankToNull(request.email()));

        return toResponse(usineRepository.save(usine));
    }

    @Transactional
    public UsineResponse setActive(Long id, boolean active) {
        Usine usine = findEntityById(id);
        usine.setActive(active);

        return toResponse(usineRepository.save(usine));
    }

    @Transactional
    public void delete(Long id) {
        Usine usine = findEntityById(id);

        if (userRepository.countByUsineId(id) > 0) {
            throw new ResourceInUseException(
                    "Cette usine possède encore des utilisateurs rattachés."
            );
        }

        usineRepository.delete(usine);
    }

    Usine findEntityById(Long id) {
        return usineRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Usine introuvable.")
                );
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private UsineResponse toResponse(Usine usine) {
        return new UsineResponse(
                usine.getId(),
                usine.getName(),
                usine.getAddress(),
                usine.getPhone(),
                usine.getEmail(),
                usine.getActive(),
                (int) userRepository.countByUsineId(usine.getId()),
                usine.getCreatedAt()
        );
    }
}
