package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "activity_intervenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityIntervenant {

    @EmbeddedId
    private ActivityIntervenantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("activityId")
    @JoinColumn(name = "activity_id")
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;
}