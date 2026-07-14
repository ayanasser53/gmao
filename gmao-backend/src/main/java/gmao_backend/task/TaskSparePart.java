package com.gmao.gmao_backend.task;

import com.gmao.gmao_backend.sparepart.SparePart;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_spare_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSparePart {

    @EmbeddedId
    @Builder.Default
    private TaskSparePartId id = new TaskSparePartId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("task")
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("sparePart")
    @JoinColumn(name = "spare_part_id", nullable = false)
    private SparePart sparePart;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;
}
