package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.sparepart.SparePart;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "activity_spare_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivitySparePart {

    @EmbeddedId
    private ActivitySparePartId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("activityId")
    @JoinColumn(name = "activity_id")
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("sparePartId")
    @JoinColumn(name = "spare_part_id")
    private SparePart sparePart;

    @Column(nullable = false)
    private int quantity;
}