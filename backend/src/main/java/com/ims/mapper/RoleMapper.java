package com.ims.mapper;

import com.ims.dtos.role.RoleResponse;
import com.ims.entity.security.RoleEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RoleMapper {

    public RoleResponse toResponse(RoleEntity entity) {
        if (entity == null) {
            return null;
        }

        List<RoleResponse.RoleMenuPermissionDto> permissions = entity.getPermissions() == null ? Collections.emptyList() :
                entity.getPermissions().stream().map(p -> RoleResponse.RoleMenuPermissionDto.builder()
                        .id(p.getId())
                        .menuId(p.getMenu() != null ? p.getMenu().getId() : null)
                        .menuCode(p.getMenu() != null ? p.getMenu().getCode() : null)
                        .menuName(p.getMenu() != null ? p.getMenu().getName() : null)
                        .canView(p.isCanView())
                        .canAdd(p.isCanAdd())
                        .canEdit(p.isCanEdit())
                        .canDelete(p.isCanDelete())
                        .canPay(p.isCanPay())
                        .canExport(p.isCanExport())
                        .canChangeStatus(p.isCanChangeStatus())
                        .build()
                ).collect(Collectors.toList());

        return RoleResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .active(entity.isActive())
                .permissions(permissions)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
