package com.gmao.gmao_backend.config;

import com.gmao.gmao_backend.costcenter.CostCenter;
import com.gmao.gmao_backend.costcenter.CostCenterRepository;
import com.gmao.gmao_backend.equipment.Equipment;
import com.gmao.gmao_backend.equipment.EquipmentRepository;
import com.gmao.gmao_backend.measure.Measure;
import com.gmao.gmao_backend.measure.MeasureRepository;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.supplier.Supplier;
import com.gmao.gmao_backend.supplier.SupplierRepository;
import com.gmao.gmao_backend.tag.Tag;
import com.gmao.gmao_backend.tag.TagGroup;
import com.gmao.gmao_backend.tag.TagGroupRepository;
import com.gmao.gmao_backend.tag.TagRepository;
import com.gmao.gmao_backend.team.Team;
import com.gmao.gmao_backend.team.TeamRepository;
import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import com.gmao.gmao_backend.usine.Usine;
import com.gmao.gmao_backend.usine.UsineRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Rattache automatiquement à une usine "par défaut" toutes les données
 * créées avant l'introduction de la séparation multi-usine (ex : base
 * existante importée depuis gmao_mobility_complete.sql), pour éviter que
 * ces données se retrouvent orphelines (usine_id = null) une fois la
 * colonne ajoutée par Hibernate.
 *
 * Les entités Task, Activity et MaintenancePlan ne sont pas concernées :
 * leur usine est déduite dynamiquement via leur équipement rattaché.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class LegacyDataMigration implements CommandLineRunner {

    private static final String DEFAULT_USINE_NAME = "Usine principale";

    private final UserRepository userRepository;
    private final UsineRepository usineRepository;
    private final TeamRepository teamRepository;
    private final TagRepository tagRepository;
    private final TagGroupRepository tagGroupRepository;
    private final CostCenterRepository costCenterRepository;
    private final SupplierRepository supplierRepository;
    private final EquipmentRepository equipmentRepository;
    private final MeasureRepository measureRepository;
    private final SparePartRepository sparePartRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<User> orphanUsers = userRepository.findAll().stream()
                .filter(user -> user.getRole() != Role.SUPERADMIN)
                .filter(user -> user.getUsine() == null)
                .toList();

        List<Team> orphanTeams = teamRepository.findAllByUsineIdIsNull();
        List<Tag> orphanTags = tagRepository.findAllByUsineIdIsNull();
        List<TagGroup> orphanTagGroups = tagGroupRepository.findAllByUsineIdIsNull();
        List<CostCenter> orphanCostCenters = costCenterRepository.findAllByUsineIdIsNull();
        List<Supplier> orphanSuppliers = supplierRepository.findAllByUsineIdIsNull();
        List<Equipment> orphanEquipment = equipmentRepository.findAllByUsineIdIsNull();
        List<Measure> orphanMeasures = measureRepository.findAllByUsineIdIsNull();
        List<SparePart> orphanSpareParts = sparePartRepository.findAllByUsineIdIsNull();

        int total = orphanUsers.size() + orphanTeams.size() + orphanTags.size()
                + orphanTagGroups.size() + orphanCostCenters.size() + orphanSuppliers.size()
                + orphanEquipment.size() + orphanMeasures.size() + orphanSpareParts.size();

        if (total == 0) {
            return;
        }

        Usine defaultUsine = usineRepository.findByNameIgnoreCase(DEFAULT_USINE_NAME)
                .orElseGet(() -> usineRepository.save(
                        Usine.builder()
                                .name(DEFAULT_USINE_NAME)
                                .active(true)
                                .build()
                ));

        orphanUsers.forEach(user -> user.setUsine(defaultUsine));
        userRepository.saveAll(orphanUsers);

        orphanTeams.forEach(team -> team.setUsine(defaultUsine));
        teamRepository.saveAll(orphanTeams);

        orphanTags.forEach(tag -> tag.setUsine(defaultUsine));
        tagRepository.saveAll(orphanTags);

        orphanTagGroups.forEach(group -> group.setUsine(defaultUsine));
        tagGroupRepository.saveAll(orphanTagGroups);

        orphanCostCenters.forEach(costCenter -> costCenter.setUsine(defaultUsine));
        costCenterRepository.saveAll(orphanCostCenters);

        orphanSuppliers.forEach(supplier -> supplier.setUsine(defaultUsine));
        supplierRepository.saveAll(orphanSuppliers);

        orphanEquipment.forEach(equipment -> equipment.setUsine(defaultUsine));
        equipmentRepository.saveAll(orphanEquipment);

        orphanMeasures.forEach(measure -> measure.setUsine(defaultUsine));
        measureRepository.saveAll(orphanMeasures);

        orphanSpareParts.forEach(sparePart -> sparePart.setUsine(defaultUsine));
        sparePartRepository.saveAll(orphanSpareParts);

        log.warn(
                "==> {} enregistrement(s) existant(s) rattaché(s) automatiquement à l'usine \"{}\".",
                total,
                DEFAULT_USINE_NAME
        );
    }
}
