package com.ims.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private String errorCode;
    private String message;
    private String path;
    private Map<String, String> fieldErrors;
    @Builder.Default
    private Instant timestamp = Instant.now();

    public static ErrorResponse of(String errorCode, String message, String path) {
        return ErrorResponse.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .path(path)
                .timestamp(Instant.now())
                .build();
    }

    public static ErrorResponse of(String errorCode, String message, String path, Map<String, String> fieldErrors) {
        return ErrorResponse.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .path(path)
                .fieldErrors(fieldErrors)
                .timestamp(Instant.now())
                .build();
    }
}
