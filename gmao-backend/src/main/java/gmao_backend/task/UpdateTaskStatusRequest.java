package com.gmao.gmao_backend.task;

import jakarta.validation.constraints.NotNull;

public record UpdateTaskStatusRequest(

        @NotNull(message = "Le statut est obligatoire.")
        TaskStatus status

) {
}
