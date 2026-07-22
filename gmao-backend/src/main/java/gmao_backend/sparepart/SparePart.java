package com.gmao.gmao_backend.sparepart;

import com.gmao.gmao_backend.supplier.Supplier;
import com.gmao.gmao_backend.tag.Tag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "spare_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SparePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 5000)
    private String description;

    @Column(unique = true)
    private String code;

    private String manufacturerReference;

    private String brand;

    private String image;

    private BigDecimal unitPrice;

    private String currency;

    private BigDecimal quantity;

    private BigDecimal minimumStock;

    private BigDecimal maximumStock;

    private BigDecimal reorderQuantity;

    private String location;

    @Column(name = "cost_center_id")
    private Long costCenterId;

    private String gtin;

    private String articleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SparePartVisibility visibility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToMany
    @JoinTable(
            name = "spare_part_tags",
            joinColumns = @JoinColumn(name = "spare_part_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "spare_part_links",
            joinColumns = @JoinColumn(name = "spare_part_id"),
            inverseJoinColumns = @JoinColumn(name = "linked_spare_part_id")
    )
    @Builder.Default
    private Set<SparePart> linkedSpareParts = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
