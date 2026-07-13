package com.gmao.gmao_backend.equipment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {
    private final Path directory;
    private static final Set<String> TYPES =
        Set.of("image/jpeg", "image/png", "image/webp");

    public FileStorageService(@Value("${app.upload-dir:uploads}") String root) {
        directory = Paths.get(root, "equipment").toAbsolutePath().normalize();
        try { Files.createDirectories(directory); }
        catch (IOException e) { throw new IllegalStateException("Dossier upload impossible.", e); }
    }

    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        if (!TYPES.contains(file.getContentType()))
            throw new IllegalArgumentException("Formats acceptés : JPG, PNG, WEBP.");
        if (file.getSize() > 5 * 1024 * 1024)
            throw new IllegalArgumentException("Image supérieure à 5 Mo.");

        String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID() + ext.toLowerCase();

        try {
            Files.copy(file.getInputStream(), directory.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Enregistrement image impossible.", e);
        }
        return "/uploads/equipment/" + filename;
    }

    public void delete(String path) {
        if (path == null || path.isBlank()) return;
        try { Files.deleteIfExists(directory.resolve(Paths.get(path).getFileName())); }
        catch (IOException e) { throw new IllegalStateException("Suppression image impossible.", e); }
    }
}
