package com.ims.dtos.role;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionUpdateRequest {

    @NotNull(message = "Permissions list cannot be null")
    private List<MenuPermissionItem> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuPermissionItem {
        @NotNull(message = "Menu ID is required")
        private Long menuId;
        private boolean canView;
        private boolean canAdd;
        private boolean canEdit;
        private boolean canDelete;
        private boolean canPay;
        private boolean canExport;
        private boolean canChangeStatus;
    }
}
