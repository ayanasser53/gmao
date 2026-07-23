package com.gmao.gmao_backend.activity;

import java.time.LocalDateTime;

public record ActivityDocumentResponse(
        Long id,
        String fileName,
        String filePath,
        String fileType,
        LocalDateTime uploadedAt
) {
}
