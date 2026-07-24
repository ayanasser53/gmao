package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.storage.DatabaseFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

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

    public ActivityDocumentStorageService(@Value("${app.upload-dir:uploads}") String root) {
    }

    public DatabaseFile save(MultipartFile file) {
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

        try {
            return new DatabaseFile(original, file.getContentType(), file.getBytes());
        } catch (IOException exception) {
            throw new IllegalStateException("Lecture du document impossible.", exception);
        }
    }

    public void delete(String path) {
    }
}
