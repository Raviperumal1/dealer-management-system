package com.ims.dtos.role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {

    private Long id;
    private String name;
    private String description;
    private boolean active;
    private List<RoleMenuPermissionDto> permissions;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleMenuPermissionDto {
        private Long id;
        private Long menuId;
        private String menuCode;
        private String menuName;
        private boolean canView;
        private boolean canAdd;
        private boolean canEdit;
        private boolean canDelete;
        private boolean canPay;
        private boolean canExport;
        private boolean canChangeStatus;
    }
}
