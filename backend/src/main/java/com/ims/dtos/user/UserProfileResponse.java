package com.ims.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Set<String> roles;
    private List<MenuPermissionDto> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MenuPermissionDto {
        private String menuCode;
        private String menuName;
        private String route;
        private String icon;
        private boolean canView;
        private boolean canAdd;
        private boolean canEdit;
        private boolean canDelete;
        private boolean canPay;
        private boolean canExport;
        private boolean canChangeStatus;
    }
}
