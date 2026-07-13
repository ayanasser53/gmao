package com.gmao.gmao_backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire.")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire.")
    private String lastName;

    @NotBlank(message = "L'adresse email est obligatoire.")
    @Email(message = "L'adresse email n'est pas valide.")
    private String email;

    private String phone;

    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Size(
            min = 6,
            message = "Le mot de passe doit contenir au moins 6 caractères."
    )
    private String password;
}