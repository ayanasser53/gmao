package com.gmao.gmao_backend.maintenanceplan;

import java.io.Serializable;
import java.util.Objects;

public class MaintenancePlanSparePartId implements Serializable {
    private Long maintenancePlan;
    private Long sparePart;

    public MaintenancePlanSparePartId() {
    }

    public MaintenancePlanSparePartId(Long maintenancePlan, Long sparePart) {
        this.maintenancePlan = maintenancePlan;
        this.sparePart = sparePart;
    }

    public Long getMaintenancePlan() {
        return maintenancePlan;
    }

    public void setMaintenancePlan(Long maintenancePlan) {
        this.maintenancePlan = maintenancePlan;
    }

    public Long getSparePart() {
        return sparePart;
    }

    public void setSparePart(Long sparePart) {
        this.sparePart = sparePart;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MaintenancePlanSparePartId that)) return false;
        return Objects.equals(maintenancePlan, that.maintenancePlan)
                && Objects.equals(sparePart, that.sparePart);
    }

    @Override
    public int hashCode() {
        return Objects.hash(maintenancePlan, sparePart);
    }
}
