package com.gmao.gmao_backend.tag;

import com.gmao.gmao_backend.usine.Usine;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "tag_groups",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tag_groups_name_usine",
                        columnNames = {"name", "usine_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(
            name = "single_choice",
            nullable = false
    )
    @Builder.Default
    private boolean singleChoice = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean mandatory = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usine_id")
    private Usine usine;

    @OneToMany(
            mappedBy = "group",
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<Tag> tags = new ArrayList<>();

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
