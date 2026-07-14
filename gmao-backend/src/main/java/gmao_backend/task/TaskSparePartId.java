package com.gmao.gmao_backend.task;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskSparePartId implements Serializable {

    private Long task;

    private Long sparePart;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof TaskSparePartId that)) {
            return false;
        }

        return Objects.equals(task, that.task) &&
                Objects.equals(sparePart, that.sparePart);
    }

    @Override
    public int hashCode() {
        return Objects.hash(task, sparePart);
    }
}
