package com.gmao.gmao_backend.common;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

@Component
public class CodeGenerator {

    public String generateUniqueCode(
            String requestedCode,
            String name,
            Predicate<String> codeAlreadyExists
    ) {
        String baseCode;

        if (
                requestedCode != null &&
                !requestedCode.isBlank()
        ) {
            baseCode = normalize(requestedCode);
        } else {
            baseCode = normalize(name);
        }

        if (baseCode.isBlank()) {
            baseCode = "item";
        }

        String candidate = baseCode;
        int suffix = 2;

        while (codeAlreadyExists.test(candidate)) {
            candidate = baseCode + "_" + suffix;
            suffix++;
        }

        return candidate;
    }

    public String normalize(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value,
                Normalizer.Form.NFD
        );

        return normalized
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}