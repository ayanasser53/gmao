package com.gmao.gmao_backend.equipment;
import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class EquipmentMapper {
    public EquipmentResponse toResponse(Equipment e) {
        Set<EquipmentTagResponse> tags = e.getTags().stream()
            .map(t -> new EquipmentTagResponse(t.getId(), t.getName(), t.getColor()))
            .collect(Collectors.toSet());

        return new EquipmentResponse(
            e.getId(), e.getImage(), e.getName(), e.getDescription(),
            e.getCostCenter() == null ? null : e.getCostCenter().getId(),
            e.getCostCenter() == null ? null : e.getCostCenter().getName(),
            e.getGtinEanCode(), e.getItemCode(),
            e.getParentEquipment() == null ? null : e.getParentEquipment().getId(),
            e.getParentEquipment() == null ? null : e.getParentEquipment().getName(),
            e.getVisibility(), tags, e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
