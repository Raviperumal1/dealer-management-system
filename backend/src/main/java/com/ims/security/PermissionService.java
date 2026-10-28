package com.ims.security;

import com.ims.entity.security.RoleMenuPermissionEntity;
import com.ims.repository.security.RoleMenuPermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service("permissionService")
@RequiredArgsConstructor
public class PermissionService {

    private final RoleMenuPermissionRepository permissionRepository;

    public boolean hasPermission(String menuCode, String action) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // Administrators bypass granular menu permission checks
        if (roles.contains("ROLE_ADMIN") || roles.contains("ADMIN")) {
            return true;
        }

        List<RoleMenuPermissionEntity> permissions = permissionRepository.findByRoleNames(roles);

        for (RoleMenuPermissionEntity p : permissions) {
            if (p.getMenu() != null && p.getMenu().getCode().equalsIgnoreCase(menuCode)) {
                switch (action.toUpperCase()) {
                    case "VIEW":
                        if (p.isCanView()) return true;
                        break;
                    case "ADD":
                        if (p.isCanAdd()) return true;
                        break;
                    case "EDIT":
                        if (p.isCanEdit()) return true;
                        break;
                    case "DELETE":
                        if (p.isCanDelete()) return true;
                        break;
                    case "PAY":
                        if (p.isCanPay()) return true;
                        break;
                    case "EXPORT":
                        if (p.isCanExport()) return true;
                        break;
                    case "STATUS":
                        if (p.isCanChangeStatus()) return true;
                        break;
                    default:
                        log.warn("Unknown permission action requested: {}", action);
                }
            }
        }

        log.debug("User [{}] denied permission [{}] on menu [{}]", authentication.getName(), action, menuCode);
        return false;
    }
}
