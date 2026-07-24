package com.gmao.gmao_backend.storage;

public record ServedDatabaseFile(
        String fileName,
        String contentType,
        byte[] data
) {
}
