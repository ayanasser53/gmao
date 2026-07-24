package com.gmao.gmao_backend.equipment;

import com.gmao.gmao_backend.costcenter.CostCenter;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.tag.Tag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "equipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500)
    private String image;

    @Column(name = "image_name", length = 255)
    private String imageName;

    @Column(name = "image_content_type", length = 100)
    private String imageContentType;

    @Column(name = "image_size")
    private Long imageSize;

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cost_center_id")
    private CostCenter costCenter;

    @Column(name = "gtin_ean_code", length = 100)
    private String gtinEanCode;

    @Column(name = "item_code", length = 100)
    private String itemCode;

    /*
     * Tags
     */

    @ManyToMany
    @JoinTable(
            name = "equipment_tags",
            joinColumns = @JoinColumn(name = "equipment_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    /*
     * Linked equipment
     */

    @ManyToMany
    @JoinTable(
            name = "equipment_links",
            joinColumns = @JoinColumn(name = "equipment_id"),
            inverseJoinColumns = @JoinColumn(name = "linked_equipment_id")
    )
    @Builder.Default
    private Set<Equipment> linkedEquipment = new HashSet<>();

    /*
     * Linked spare parts
     */

    @ManyToMany
    @JoinTable(
            name = "equipment_spare_parts",
            joinColumns = @JoinColumn(name = "equipment_id"),
            inverseJoinColumns = @JoinColumn(name = "spare_part_id")
    )
    @Builder.Default
    private Set<SparePart> linkedSpareParts = new HashSet<>();

    /*
     * Dates
     */

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
