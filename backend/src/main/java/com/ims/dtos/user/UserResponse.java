package com.ims.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private boolean active;
    private Instant lastLoginAt;
    private Set<String> roles;
    private Instant createdAt;
    private Instant updatedAt;
}
