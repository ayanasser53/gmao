package com.gmao.gmao_backend.activity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityIntervenantId implements Serializable {
    private Long activityId;
    private Long userId;
}