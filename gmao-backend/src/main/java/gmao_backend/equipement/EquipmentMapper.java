package com.gmao.gmao_backend.equipment;

import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.tag.Tag;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class EquipmentMapper {

    public EquipmentResponse toResponse(
            Equipment equipment
    ) {
        return new EquipmentResponse(

                equipment.getId(),

                equipment.getImage(),

                equipment.getName(),

                equipment.getDescription(),

                equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getId()
                        : null,

                equipment.getCostCenter() != null
                        ? equipment.getCostCenter().getName()
                        : null,

                equipment.getGtinEanCode(),

                equipment.getItemCode(),

                mapTags(equipment.getTags()),

                mapLinkedEquipment(
                        equipment.getLinkedEquipment()
                ),

                mapLinkedSpareParts(
                        equipment.getLinkedSpareParts()
                ),

                equipment.getCreatedAt(),

                equipment.getUpdatedAt()
        );
    }

    private Set<EquipmentTagResponse> mapTags(
            Set<Tag> tags
    ) {
        if (tags == null) {
            return Collections.emptySet();
        }

        return tags.stream()
                .map(tag -> new EquipmentTagResponse(
                        tag.getId(),
                        tag.getName(),
                        tag.getCode(),
                        tag.getColor(),
                        tag.getGroup() != null
                                ? tag.getGroup().getId()
                                : null,
                        tag.getGroup() != null
                                ? tag.getGroup().getName()
                                : null
                ))
                .collect(Collectors.toSet());
    }

    private Set<LinkedEquipmentResponse> mapLinkedEquipment(
            Set<Equipment> linkedEquipment
    ) {
        if (linkedEquipment == null) {
            return Collections.emptySet();
        }

        return linkedEquipment.stream()
                .map(equipment ->
                        new LinkedEquipmentResponse(
                                equipment.getId(),
                                equipment.getName(),
                                equipment.getImage(),
                                equipment.getItemCode()
                        )
                )
                .collect(Collectors.toSet());
    }

    private Set<LinkedSparePartResponse> mapLinkedSpareParts(
            Set<SparePart> linkedSpareParts
    ) {
        if (linkedSpareParts == null) {
            return Collections.emptySet();
        }

        return linkedSpareParts.stream()
                .map(sparePart ->
                        new LinkedSparePartResponse(
                                sparePart.getId(),
                                sparePart.getCode(),
                                sparePart.getName(),
                                sparePart.getImageUrl(),
                                sparePart.getQuantity()
                        )
                )
                .collect(Collectors.toSet());
    }
}