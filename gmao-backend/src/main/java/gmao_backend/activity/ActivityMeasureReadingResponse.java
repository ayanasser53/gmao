package com.gmao.gmao_backend.activity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ActivityMeasureReadingResponse(
        Long id,
        Long measureId,
        String measureName,
        String unitSymbol,
        BigDecimal value,
        LocalDate readingDate,
        LocalTime readingHour
) {
}
