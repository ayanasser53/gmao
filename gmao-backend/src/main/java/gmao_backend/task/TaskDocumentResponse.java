package com.gmao.gmao_backend.task;

import java.time.LocalDateTime;

public record TaskDocumentResponse(
        Long id,
        String fileName,
        String filePath,
        String fileType,
        boolean isLink,
        LocalDateTime uploadedAt
) {
}
