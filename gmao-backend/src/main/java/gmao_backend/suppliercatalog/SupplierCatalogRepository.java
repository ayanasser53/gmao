package com.gmao.gmao_backend.suppliercatalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierCatalogRepository extends JpaRepository<SupplierCatalogItem, Long> {

    List<SupplierCatalogItem> findAllByOrderByCreatedAtDesc();
}
