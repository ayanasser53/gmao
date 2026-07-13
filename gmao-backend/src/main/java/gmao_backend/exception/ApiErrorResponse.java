package com.gmao.gmao_backend.exception;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        int status,
        String error,
        String message,
        LocalDateTime timestamp
) {
}