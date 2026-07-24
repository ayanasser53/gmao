package com.gmao.gmao_backend.equipment;

import com.gmao.gmao_backend.storage.DatabaseFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Service
public class FileStorageService {

    private static final Set<String> TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    public FileStorageService(@Value("${app.upload-dir:uploads}") String root) {
    }

    public DatabaseFile save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (!TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Formats acceptes : JPG, PNG, WEBP.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image superieure a 5 Mo.");
        }

        String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();

        try {
            return new DatabaseFile(original, file.getContentType(), file.getBytes());
        } catch (IOException exception) {
            throw new IllegalStateException("Lecture image impossible.", exception);
        }
    }

    public void delete(String path) {
    }
}
