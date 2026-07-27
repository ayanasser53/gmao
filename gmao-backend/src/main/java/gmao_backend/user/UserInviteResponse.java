package com.gmao.gmao_backend.user;

/**
 * Réponse renvoyée uniquement à la création d'un utilisateur (invite),
 * pour permettre d'afficher une seule fois le mot de passe temporaire
 * généré. Ce mot de passe n'est jamais stocké en clair ni renvoyé à
 * nouveau par la suite (seul son hash est conservé en base).
 */
public record UserInviteResponse(
        UserDetailResponse user,
        String temporaryPassword
) {
}
