package com.gmao.gmao_backend.usine;

import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.exception.ResourceAlreadyExistsException;
import com.gmao.gmao_backend.exception.ResourceInUseException;
import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.maintenanceplan.MaintenancePlanRepository;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.task.TaskRepository;
import com.gmao.gmao_backend.team.TeamRepository;
import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsineService {

    private final UsineRepository usineRepository;
    private final UserRepository userRepository;
    private final EquipmentRepository equipmentRepository;
    private final TaskRepository taskRepository;
    private final SparePartRepository sparePartRepository;
    private final TeamRepository teamRepository;
    private final MaintenancePlanRepository maintenancePlanRepository;

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

    /**
     * Tableau de bord détaillé d'une usine : mêmes indicateurs que ceux
     * affichés à l'administrateur de cette usine, consultables par le
     * SUPERADMIN depuis la fiche usine ("Voir le dashboard").
     */
    @Transactional(readOnly = true)
    public UsineDashboardResponse getDashboard(Long id) {
        Usine usine = findEntityById(id);

        UsineDashboardResponse.UsineStats stats = new UsineDashboardResponse.UsineStats(
                userRepository.countByUsineId(id),
                equipmentRepository.countByUsineId(id),
                taskRepository.countByUsineId(id),
                sparePartRepository.countByUsineId(id),
                teamRepository.countByUsineId(id),
                maintenancePlanRepository.countByUsineId(id)
        );

        List<UsineDashboardResponse.UsineAdminSummary> admins = userRepository
                .findAllByUsineId(id)
                .stream()
                .filter(user -> user.getRole() == Role.ADMIN)
                .map(this::toAdminSummary)
                .toList();

        return new UsineDashboardResponse(
                usine.getId(),
                usine.getName(),
                usine.getAddress(),
                usine.getPhone(),
                usine.getEmail(),
                usine.getActive(),
                usine.getCreatedAt(),
                stats,
                admins
        );
    }

    /**
     * Vue d'ensemble globale (toutes usines confondues), affichée au
     * SUPERADMIN sur la liste des usines.
     */
    @Transactional(readOnly = true)
    public UsineGlobalDashboardResponse getGlobalDashboard() {
        List<Usine> usines = usineRepository.findAll();

        long totalUsers = 0;
        long totalEquipment = 0;
        long totalTasks = 0;
        long totalSpareParts = 0;
        long totalTeams = 0;
        long totalMaintenancePlans = 0;
        long activeUsines = 0;

        List<UsineGlobalDashboardResponse.UsineSummaryStats> perUsine = new ArrayList<>();

        for (Usine usine : usines) {
            Long usineId = usine.getId();

            long userCount = userRepository.countByUsineId(usineId);
            long equipmentCount = equipmentRepository.countByUsineId(usineId);
            long taskCount = taskRepository.countByUsineId(usineId);

            totalUsers += userCount;
            totalEquipment += equipmentCount;
            totalTasks += taskCount;
            totalSpareParts += sparePartRepository.countByUsineId(usineId);
            totalTeams += teamRepository.countByUsineId(usineId);
            totalMaintenancePlans += maintenancePlanRepository.countByUsineId(usineId);

            if (Boolean.TRUE.equals(usine.getActive())) {
                activeUsines++;
            }

            perUsine.add(new UsineGlobalDashboardResponse.UsineSummaryStats(
                    usineId,
                    usine.getName(),
                    Boolean.TRUE.equals(usine.getActive()),
                    userCount,
                    equipmentCount,
                    taskCount
            ));
        }

        return new UsineGlobalDashboardResponse(
                usines.size(),
                activeUsines,
                totalUsers,
                totalEquipment,
                totalTasks,
                totalSpareParts,
                totalTeams,
                totalMaintenancePlans,
                perUsine
        );
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

    private UsineDashboardResponse.UsineAdminSummary toAdminSummary(User user) {
        return new UsineDashboardResponse.UsineAdminSummary(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                Boolean.TRUE.equals(user.getActive())
        );
    }
}
