package com.gmao.gmao_backend.security;

import com.gmao.gmao_backend.exception.InvalidRequestException;
import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Donne accès à l'utilisateur authentifié (chargé en base par le
 * JwtAuthenticationFilter) et à son usine, pour que chaque couche
 * service puisse filtrer les données par usine (multi-tenant).
 */
@Component
public class CurrentUserProvider {

    public User getUser() {
        Object principal = SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        if (!(principal instanceof User user)) {
            throw new InvalidRequestException("Utilisateur non authentifié.");
        }

        return user;
    }

    public boolean isSuperAdmin() {
        return getUser().getRole() == Role.SUPERADMIN;
    }

    /**
     * Id de l'usine de l'utilisateur courant.
     * Lève une exception si l'utilisateur est un SUPERADMIN (pas d'usine)
     * ou si, anormalement, un compte non-SUPERADMIN n'a pas d'usine.
     */
    public Long requireUsineId() {
        User user = getUser();

        if (user.getUsine() == null) {
            throw new InvalidRequestException(
                    "Aucune usine n'est associée à cet utilisateur."
            );
        }

        return user.getUsine().getId();
    }

    /**
     * Id de l'usine de l'utilisateur courant, ou null s'il s'agit d'un SUPERADMIN.
     */
    public Long getUsineIdOrNull() {
        User user = getUser();
        return user.getUsine() != null ? user.getUsine().getId() : null;
    }
}
