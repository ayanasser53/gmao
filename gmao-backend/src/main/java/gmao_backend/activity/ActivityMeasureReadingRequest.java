package com.gmao.gmao_backend.activity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ActivityMeasureReadingRequest(
        Long measureId,
        BigDecimal value,
        LocalDate readingDate,
        LocalTime readingHour
) {
}
