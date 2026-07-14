package com.gmao.gmao_backend.storage;

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
public class AppFileStorageService {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final Path rootDirectory;

    public AppFileStorageService(@Value("${app.upload-dir:uploads}") String root) {
        this.rootDirectory = Paths.get(root).toAbsolutePath().normalize();
    }

    public String save(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Formats acceptes : JPG, PNG, WEBP.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image superieure a 5 Mo.");
        }

        Path directory = rootDirectory.resolve(folder).normalize();

        try {
            Files.createDirectories(directory);
        } catch (IOException exception) {
            throw new IllegalStateException("Dossier upload impossible.", exception);
        }

        String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
        String extension = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID() + extension.toLowerCase();

        try {
            Files.copy(
                    file.getInputStream(),
                    directory.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Enregistrement image impossible.", exception);
        }

        return "/uploads/" + folder + "/" + filename;
    }

    public void delete(String path, String folder) {
        if (path == null || path.isBlank() || !path.startsWith("/uploads/" + folder + "/")) {
            return;
        }

        try {
            Files.deleteIfExists(
                    rootDirectory
                            .resolve(folder)
                            .resolve(Paths.get(path).getFileName())
                            .normalize()
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Suppression image impossible.", exception);
        }
    }
}