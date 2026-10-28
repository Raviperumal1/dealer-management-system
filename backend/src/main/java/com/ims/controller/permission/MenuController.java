package com.ims.controller.permission;

import com.ims.common.ApiResponse;
import com.ims.dtos.role.MenuResponse;
import com.ims.dtos.user.UserProfileResponse;
import com.ims.service.serviceInterface.auth.AuthService;
import com.ims.service.serviceInterface.role.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/menus")
@RequiredArgsConstructor
@Tag(name = "Menu Management", description = "Endpoints for retrieving application navigation menus and user authorized permissions")
public class MenuController {

    private final RoleService roleService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "List all menus", description = "Returns all available system menus")
    public ResponseEntity<ApiResponse<List<MenuResponse>>> getAllMenus() {
        List<MenuResponse> response = roleService.getAllMenus();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user menu permissions", description = "Returns active menus and allowed actions for logged-in user")
    public ResponseEntity<ApiResponse<List<UserProfileResponse.MenuPermissionDto>>> getMyMenus(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = authService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(profile.getPermissions()));
    }
}
