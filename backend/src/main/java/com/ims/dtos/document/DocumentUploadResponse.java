package com.ims.dtos.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    private String fileKey;
    private String originalFileName;
    private String contentType;
    private long fileSize;
    private String downloadUrl;
    private Instant uploadedAt;
}
