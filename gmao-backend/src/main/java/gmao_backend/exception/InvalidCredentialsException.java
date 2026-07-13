package com.gmao.gmao_backend.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Adresse email ou mot de passe incorrect.");
    }
}