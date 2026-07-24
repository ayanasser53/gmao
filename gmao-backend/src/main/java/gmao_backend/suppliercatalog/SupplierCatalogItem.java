package com.gmao.gmao_backend.suppliercatalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_catalog_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierCatalogItem {

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

    @Column(name = "equipment_name", nullable = false, length = 255)
    private String equipmentName;

    @Column(length = 150)
    private String category;

    @Column(length = 150)
    private String brand;

    @Column(name = "manufacturer_part_number", length = 150)
    private String manufacturerPartNumber;

    @Column(name = "gtin_ean_code", length = 100)
    private String gtinEanCode;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;

    @Column(name = "supplier_logo", length = 50)
    private String supplierLogo;

    @Column(name = "supplier_siren", length = 50)
    private String supplierSiren;

    @Column(name = "supplier_phone", length = 50)
    private String supplierPhone;

    @Column(name = "supplier_description", columnDefinition = "TEXT")
    private String supplierDescription;

    @Column(name = "supplier_id")
    private Long supplierId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
