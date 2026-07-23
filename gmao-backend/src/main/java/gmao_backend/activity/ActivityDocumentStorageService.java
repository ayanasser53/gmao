package com.gmao.gmao_backend.activity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ActivityDocumentStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv"
    );

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;

    private final Path directory;

    public ActivityDocumentStorageService(@Value("${app.upload-dir:uploads}") String root) {
        directory = Paths.get(root, "activities").toAbsolutePath().normalize();

        try {
            Files.createDirectories(directory);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de creer le dossier upload des activites.", e);
        }
    }

    public String save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "Formats acceptes : PDF, Word, Excel, PowerPoint, image, texte, CSV."
            );
        }

        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Fichier superieur a 10 Mo.");
        }

        String original = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID() + ext.toLowerCase();

        try {
            Files.copy(
                    file.getInputStream(),
                    directory.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (IOException e) {
            throw new IllegalStateException("Enregistrement du document impossible.", e);
        }

        return "/uploads/activities/" + filename;
    }

    public void delete(String path) {
        if (path == null || path.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(directory.resolve(Paths.get(path).getFileName()));
        } catch (IOException e) {
            throw new IllegalStateException("Suppression du document impossible.", e);
        }
    }
}
