package com.ims.controller.role;

import com.ims.common.ApiResponse;
import com.ims.dtos.role.*;
import com.ims.service.serviceInterface.role.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@Tag(name = "Role & Permission Management", description = "Endpoints for creating custom roles and assigning menu permissions")
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create custom role", description = "Creates a new custom role with default permissions matrix")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody RoleCreateRequest request) {
        RoleResponse response = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Role created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all roles", description = "Retrieves all system roles with assigned permissions")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> response = roleService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get role by ID", description = "Retrieves role details and full permissions matrix")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long id) {
        RoleResponse response = roleService.getRoleById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update role", description = "Updates role description or active status")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request) {
        RoleResponse response = roleService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Role updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete role", description = "Deletes custom role if not in active use")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.ok("Role deleted successfully", null));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update role permissions matrix", description = "Configures fine-grained menu action permissions for role")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRolePermissions(
            @PathVariable Long id,
            @Valid @RequestBody RolePermissionUpdateRequest request) {
        RoleResponse response = roleService.updateRolePermissions(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Role permissions updated successfully", response));
    }
}
