package com.gmao.gmao_backend.unit;

import org.springframework.stereotype.Component;

@Component
public class UnitMapper {

    public UnitResponse toResponse(MeasurementUnit unit) {
        return new UnitResponse(
                unit.getId(),
                unit.getName(),
                unit.getSymbol(),
                unit.getCode(),
                unit.getUnitType(),
                unit.getCreatedAt(),
                unit.getUpdatedAt()
        );
    }
}