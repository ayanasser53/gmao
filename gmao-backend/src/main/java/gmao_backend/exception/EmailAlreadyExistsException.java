package com.gmao.gmao_backend.exception;

public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException() {
        super("Cette adresse email est déjà utilisée.");
    }
}