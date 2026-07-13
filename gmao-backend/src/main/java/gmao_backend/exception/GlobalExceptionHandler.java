package com.gmao.gmao_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailAlreadyExists(
            EmailAlreadyExistsException exception
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException exception
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                exception.getMessage()
        );
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountDisabled(
            AccountDisabledException exception
    ) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                exception.getMessage()
        );
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(
            InvalidRequestException exception
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException exception
    ) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(" "));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                message
        );
    }
    @ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
        ResourceNotFoundException exception
) {
    return buildResponse(
            HttpStatus.NOT_FOUND,
            exception.getMessage()
    );
}

@ExceptionHandler(ResourceAlreadyExistsException.class)
public ResponseEntity<ApiErrorResponse> handleResourceAlreadyExists(
        ResourceAlreadyExistsException exception
) {
    return buildResponse(
            HttpStatus.CONFLICT,
            exception.getMessage()
    );
}

@ExceptionHandler(ResourceInUseException.class)
public ResponseEntity<ApiErrorResponse> handleResourceInUse(
        ResourceInUseException exception
) {
    return buildResponse(
            HttpStatus.CONFLICT,
            exception.getMessage()
    );
}

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception
    ) {
        exception.printStackTrace();

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur interne est survenue."
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String message
    ) {
        ApiErrorResponse response = new ApiErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                LocalDateTime.now()
        );

        return ResponseEntity.status(status).body(response);
    }
}