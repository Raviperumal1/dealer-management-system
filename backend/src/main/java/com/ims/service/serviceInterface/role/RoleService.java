package com.ims.service.serviceInterface.role;

import com.ims.dtos.role.*;

import java.util.List;

public interface RoleService {
    RoleResponse createRole(RoleCreateRequest request);
    List<RoleResponse> getAllRoles();
    RoleResponse getRoleById(Long id);
    RoleResponse updateRole(Long id, RoleUpdateRequest request);
    void deleteRole(Long id);
    List<MenuResponse> getAllMenus();
    RoleResponse updateRolePermissions(Long roleId, RolePermissionUpdateRequest request);
}
