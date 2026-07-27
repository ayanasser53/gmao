package com.gmao.gmao_backend.costcenter;

import com.gmao.gmao_backend.usine.Usine;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "cost_centers",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cost_centers_name_usine",
                columnNames = {"name", "usine_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usine_id")
    private Usine usine;
}
