package com.ims.utils.storage;

import com.ims.dtos.document.DocumentUploadResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    DocumentUploadResponse storeFile(MultipartFile file, String category);
    Resource loadFileAsResource(String fileKey);
    void deleteFile(String fileKey);
}
