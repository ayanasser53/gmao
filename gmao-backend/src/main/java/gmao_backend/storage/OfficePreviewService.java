package com.gmao.gmao_backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class OfficePreviewService {

    private static final String PDF_TYPE = "application/pdf";

    private final String officeCommand;

    public OfficePreviewService(@Value("${app.office-converter-command:soffice}") String officeCommand) {
        this.officeCommand = officeCommand;
    }

    public Optional<DatabaseFile> createPdfPreview(DatabaseFile original) {
        if (original == null || !isWordDocument(original)) {
            return Optional.empty();
        }

        Path directory = null;

        try {
            directory = Files.createTempDirectory("gmao-office-preview-");
            String inputName = UUID.randomUUID() + extensionOf(original.fileName());
            Path input = directory.resolve(inputName);
            Files.write(input, original.data());

            Process process = new ProcessBuilder(
                    officeCommand,
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    directory.toString(),
                    input.toString()
            )
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();

            boolean finished = process.waitFor(45, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return Optional.empty();
            }

            if (process.exitValue() != 0) {
                return Optional.empty();
            }

            Path output = directory.resolve(inputName.replaceFirst("\\.[^.]+$", ".pdf"));
            if (!Files.exists(output)) {
                return Optional.empty();
            }

            return Optional.of(
                    new DatabaseFile(
                            original.fileName().replaceFirst("\\.[^.]+$", ".pdf"),
                            PDF_TYPE,
                            Files.readAllBytes(output)
                    )
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException exception) {
            return Optional.empty();
        } finally {
            deleteQuietly(directory);
        }
    }

    private boolean isWordDocument(DatabaseFile file) {
        String name = file.fileName() == null ? "" : file.fileName().toLowerCase(Locale.ROOT);
        String type = file.contentType() == null ? "" : file.contentType();

        return name.endsWith(".doc")
                || name.endsWith(".docx")
                || type.equals("application/msword")
                || type.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    private String extensionOf(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".docx";
        }

        return fileName.substring(fileName.lastIndexOf("."));
    }

    private void deleteQuietly(Path path) {
        if (path == null || !Files.exists(path)) {
            return;
        }

        try (var files = Files.walk(path)) {
            files.sorted((left, right) -> right.compareTo(left))
                    .forEach(file -> {
                        try {
                            Files.deleteIfExists(file);
                        } catch (IOException ignored) {
                        }
                    });
        } catch (IOException ignored) {
        }
    }
}
