package com.gmao.gmao_backend.task;

public record TaskSparePartResponse(
        Long sparePartId,
        String code,
        String name,
        String imageUrl,
        int quantity
) {
}
