package com.gmao.gmao_backend.notification;

import com.gmao.gmao_backend.exception.ResourceNotFoundException;
import com.gmao.gmao_backend.security.CurrentUserProvider;
import com.gmao.gmao_backend.user.User;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;

    /**
     * Crée une notification pour un destinataire donné. Utilisé par les
     * autres services (tâches, activités, pièces, commandes, plans) au fil
     * des événements métier. N'échoue jamais bruyamment : un destinataire
     * null est simplement ignoré (ex: tâche sans créateur connu).
     */
    @Transactional
    public void notify(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String link
    ) {
        if (recipient == null) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .read(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findMine() {
        User currentUser = currentUserProvider.getUser();

        return notificationRepository
                .findAllByRecipientIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        User currentUser = currentUserProvider.getUser();

        return notificationRepository.countByRecipientIdAndReadFalse(currentUser.getId());
    }

    @Transactional
    public void markAsRead(Long id) {
        User currentUser = currentUserProvider.getUser();

        Notification notification = notificationRepository
                .findByIdAndRecipientId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable."));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = currentUserProvider.getUser();

        List<Notification> unread =
                notificationRepository.findAllByRecipientIdAndReadFalse(currentUser.getId());

        unread.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
