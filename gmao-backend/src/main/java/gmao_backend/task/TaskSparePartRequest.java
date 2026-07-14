package com.gmao.gmao_backend.task;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TaskSparePartRequest(

        @NotNull(message = "La pièce de rechange est obligatoire.")
        Long sparePartId,

        @Min(value = 1, message = "La quantité doit être d'au moins 1.")
        int quantity

) {
}
