package com.ims.mapper;

import com.ims.dtos.user.UserResponse;
import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.UserEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponse toResponse(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        Set<String> roleNames = entity.getRoles() == null ? Collections.emptySet() :
                entity.getRoles().stream().map(RoleEntity::getName).collect(Collectors.toSet());

        return UserResponse.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .active(entity.isActive())
                .lastLoginAt(entity.getLastLoginAt())
                .roles(roleNames)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
