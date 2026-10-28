package com.ims.controller.documents;

import com.ims.common.ApiResponse;
import com.ims.dtos.document.DocumentUploadResponse;
import com.ims.utils.storage.StorageService;
import com.ims.repository.vehicle.VehicleDocumentRepository;
import com.ims.repository.vehicle.VehiclePhotoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Tag(name = "Document & File Storage", description = "Endpoints for uploading and downloading vehicle photos, RC documents, insurance files, and invoices")
public class DocumentController {

    private final StorageService storageService;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final VehiclePhotoRepository vehiclePhotoRepository;
    private final com.ims.repository.finance.LoanDocumentRepository loanDocumentRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload document or photo", description = "Uploads file with MIME and extension verification (JPEG, PNG, WEBP, PDF) and stores it outside source code with a secure UUID key")
    public ResponseEntity<ApiResponse<DocumentUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "GENERAL") String category) {
        DocumentUploadResponse response = storageService.storeFile(file, category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("File uploaded successfully", response));
    }

    @GetMapping("/{fileKey}/download")
    @Operation(summary = "Download document or photo", description = "Downloads stored document or photo by its secure file identifier or database entity ID")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileKey) {
        String actualKey = fileKey;
        if (fileKey != null && fileKey.matches("^\\d+$")) {
            Long entityId = Long.parseLong(fileKey);
            // Check vehicle document repository
            var docOpt = vehicleDocumentRepository.findById(entityId);
            if (docOpt.isPresent()) {
                String path = docOpt.get().getFilePath();
                actualKey = extractFileKey(path);
            } else {
                var photoOpt = vehiclePhotoRepository.findById(entityId);
                if (photoOpt.isPresent()) {
                    String url = photoOpt.get().getPhotoUrl();
                    actualKey = extractFileKey(url);
                } else {
                    var loanDocOpt = loanDocumentRepository.findById(entityId);
                    if (loanDocOpt.isPresent()) {
                        actualKey = loanDocOpt.get().getFileKey();
                    }
                }
            }
        }

        Resource resource = storageService.loadFileAsResource(actualKey);

        String contentType = "application/octet-stream";
        try {
            String path = resource.getURL().getPath().toLowerCase();
            if (path.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (path.endsWith(".png")) {
                contentType = "image/png";
            } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (path.endsWith(".webp")) {
                contentType = "image/webp";
            }
        } catch (IOException ignored) {
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    private String extractFileKey(String pathOrUrl) {
        if (pathOrUrl == null) return "";
        // Strip query params or prefix
        String clean = pathOrUrl.split("\\?")[0];
        if (clean.contains("/download")) {
            clean = clean.replace("/download", "");
        }
        int lastSlash = clean.lastIndexOf('/');
        if (lastSlash >= 0) {
            return clean.substring(lastSlash + 1);
        }
        return clean;
    }
}
