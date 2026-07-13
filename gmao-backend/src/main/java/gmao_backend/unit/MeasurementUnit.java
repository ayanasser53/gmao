package com.gmao.gmao_backend.unit;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "units",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_unit_code",
                        columnNames = "code"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeasurementUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", nullable = false)
    private UnitType unitType;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}