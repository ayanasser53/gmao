package com.gmao.gmao_backend.task;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDocument {

    /**
     * Used for the file_type column to distinguish an uploaded
     * file from a plain external link, since both are stored in
     * the same task_documents table.
     */
    public static final String LINK_TYPE = "LINK";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(name = "preview_file_type", length = 100)
    private String previewFileType;

    @Column(name = "preview_file_size")
    private Long previewFileSize;

    @Lob
    @Column(name = "preview_file_data", columnDefinition = "LONGBLOB")
    private byte[] previewFileData;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    public boolean isLink() {
        return LINK_TYPE.equals(fileType);
    }
}
