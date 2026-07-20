package com.gmao.gmao_backend.activity;

import jakarta.validation.constraints.NotNull;

public record ActivitySparePartRequest(
        @NotNull Long sparePartId,
        int quantity
) {
}