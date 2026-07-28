package com.gmao.gmao_backend.security;

import com.gmao.gmao_backend.exception.InvalidRequestException;
import com.gmao.gmao_backend.user.Role;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.usine.UsineRepository;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Donne accès à l'utilisateur authentifié (chargé en base par le
 * JwtAuthenticationFilter) et à son usine, pour que chaque couche
 * service puisse filtrer les données par usine (multi-tenant).
 */
@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    /**
     * En-tête utilisé par un SUPERADMIN pour "consulter" le tableau de bord
     * d'une usine précise (bouton "Voir le dashboard" depuis la fiche usine).
     * Elle n'a aucun effet pour les autres rôles, qui restent toujours
     * cantonnés à leur propre usine.
     */
    public static final String USINE_CONTEXT_HEADER = "X-Usine-Context";

    private final UsineRepository usineRepository;

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
     * Id de l'usine sur laquelle les requêtes courantes doivent être
     * filtrées.
     * - Pour un ADMIN/TECHNICIAN/PRODUCTION : son usine.
     * - Pour un SUPERADMIN qui consulte une usine via le header
     *   X-Usine-Context (bouton "Voir le dashboard") : cette usine.
     * - Pour un SUPERADMIN sans contexte : lève une exception, il n'a pas
     *   d'usine propre.
     */
    public Long requireUsineId() {
        User user = getUser();

        if (user.getUsine() != null) {
            return user.getUsine().getId();
        }

        Long impersonated = impersonatedUsineId();

        if (user.getRole() == Role.SUPERADMIN && impersonated != null) {
            return impersonated;
        }

        throw new InvalidRequestException(
                "Aucune usine n'est associée à cet utilisateur."
        );
    }

    /**
     * Id de l'usine de l'utilisateur courant, ou celle consultée via le
     * header X-Usine-Context pour un SUPERADMIN, ou null si aucune des deux.
     */
    public Long getUsineIdOrNull() {
        User user = getUser();

        if (user.getUsine() != null) {
            return user.getUsine().getId();
        }

        if (user.getRole() == Role.SUPERADMIN) {
            return impersonatedUsineId();
        }

        return null;
    }

    /**
     * True si un SUPERADMIN est en train de consulter le tableau de bord
     * d'une usine précise via le header X-Usine-Context.
     */
    public boolean isImpersonating() {
        User user = getUser();
        return user.getRole() == Role.SUPERADMIN && impersonatedUsineId() != null;
    }

    private Long impersonatedUsineId() {
        HttpServletRequest request = currentRequest();

        if (request == null) {
            return null;
        }

        String header = request.getHeader(USINE_CONTEXT_HEADER);

        if (header == null || header.isBlank()) {
            return null;
        }

        Long usineId;

        try {
            usineId = Long.parseLong(header.trim());
        } catch (NumberFormatException ex) {
            return null;
        }

        return usineRepository.existsById(usineId) ? usineId : null;
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        return attributes != null ? attributes.getRequest() : null;
    }
}
