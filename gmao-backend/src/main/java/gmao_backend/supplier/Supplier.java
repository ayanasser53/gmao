package com.gmao.gmao_backend.supplier;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "suppliers",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_supplier_email",
                        columnNames = "email"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(name = "siren_or_siret", length = 50)
    private String sirenOrSiret;

    @Column(length = 100)
    private String reference;

    @Column(length = 50)
    private String phone;

    @Column(length = 50)
    private String fax;

    @Column(length = 255)
    private String address;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SupplierVisibility visibility = SupplierVisibility.PRIVATE;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_name", length = 255)
    private String logoName;

    @Column(name = "logo_content_type", length = 100)
    private String logoContentType;

    @Column(name = "logo_size")
    private Long logoSize;

    @Lob
    @Column(name = "logo_data", columnDefinition = "LONGBLOB")
    private byte[] logoData;

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
