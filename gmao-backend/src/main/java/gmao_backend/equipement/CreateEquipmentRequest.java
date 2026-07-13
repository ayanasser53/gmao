package com.gmao.gmao_backend.equipment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;
public record CreateEquipmentRequest(
    @NotBlank(message = "Le nom est obligatoire.") @Size(max = 255) String name,
    @Size(max = 5000) String description,
    Long costCenterId,
    @Size(max = 100) String gtinEanCode,
    @Size(max = 100) String itemCode,
    Long parentEquipmentId,
    EquipmentVisibility visibility,
    Set<Long> tagIds
) {}
