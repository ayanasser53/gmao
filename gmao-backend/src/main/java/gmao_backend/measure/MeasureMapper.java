package com.gmao.gmao_backend.measure;

import org.springframework.stereotype.Component;

@Component
public class MeasureMapper {

    public MeasureResponse toResponse(Measure measure) {
        return new MeasureResponse(
                measure.getId(),
                measure.getName(),
                measure.getCode(),
                measure.getDescription(),

                measure.getUnit().getId(),
                measure.getUnit().getName(),
                measure.getUnit().getSymbol(),
                measure.getUnit().getUnitType(),

                measure.getCreatedAt(),
                measure.getUpdatedAt()
        );
    }
}