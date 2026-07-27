package com.gmao.gmao_backend.tag;

import com.gmao.gmao_backend.usine.Usine;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "tags",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tags_code_usine",
                        columnNames = {"code", "usine_id"}
                ),
                @UniqueConstraint(
                        name = "uk_tags_name_usine",
                        columnNames = {"name", "usine_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String color = "#8A8F98";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private TagGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usine_id")
    private Usine usine;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;
}
