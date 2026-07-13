package com.gmao.gmao_backend.exception;

public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException() {
        super("Ce compte est désactivé.");
    }
}