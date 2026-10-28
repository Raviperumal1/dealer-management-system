package com.ims.utils.storage;

import com.ims.dtos.document.DocumentUploadResponse;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements StorageService {

    private final Path rootLocation;
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "pdf", "webp");
    private static final List<String> ALLOWED_MIME_TYPES = List.of("image/jpeg", "image/png", "image/webp", "application/pdf");

    public FileStorageServiceImpl(@Value("${app.storage.upload-dir:uploads/}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Initialized document storage directory at: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Override
    public DocumentUploadResponse storeFile(MultipartFile file, String category) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleViolationException("Cannot upload empty file");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "file"));

        // Path Traversal Protection
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BusinessRuleViolationException("Invalid file name characters detected");
        }

        // File Extension Validation
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            extension = originalFilename.substring(dotIdx + 1).toLowerCase();
        }
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessRuleViolationException("Unsupported file extension: " + extension + ". Allowed: " + ALLOWED_EXTENSIONS);
        }

        // MIME Type Validation
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleViolationException("Unsupported MIME type: " + contentType);
        }

        // Generate Secure Storage Key
        String fileKey = UUID.randomUUID() + "." + extension;
        Path targetLocation = this.rootLocation.resolve(fileKey);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file: {} -> key: {}", originalFilename, fileKey);

            return DocumentUploadResponse.builder()
                    .fileKey(fileKey)
                    .originalFileName(originalFilename)
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .downloadUrl("/documents/" + fileKey + "/download")
                    .uploadedAt(Instant.now())
                    .build();
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileKey) {
        try {
            if (fileKey.contains("..") || fileKey.contains("/") || fileKey.contains("\\")) {
                throw new BusinessRuleViolationException("Invalid file key");
            }

            Path file = this.rootLocation.resolve(fileKey).normalize();
            if (!file.startsWith(this.rootLocation)) {
                throw new BusinessRuleViolationException("Access denied: File outside storage root");
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or not readable: " + fileKey);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found: " + fileKey);
        }
    }

    @Override
    public void deleteFile(String fileKey) {
        try {
            Path file = this.rootLocation.resolve(fileKey).normalize();
            if (file.startsWith(this.rootLocation)) {
                Files.deleteIfExists(file);
                log.info("Deleted stored file key: {}", fileKey);
            }
        } catch (IOException e) {
            log.warn("Could not delete file: {}", fileKey);
        }
    }
}
