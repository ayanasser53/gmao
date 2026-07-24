package com.gmao.gmao_backend.storage;

public record DatabaseFile(
        String fileName,
        String contentType,
        byte[] data
) {
}
