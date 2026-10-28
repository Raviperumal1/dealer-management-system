package com.ims.service.impl.role;

import com.ims.dtos.role.*;
import com.ims.entity.security.MenuEntity;
import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.RoleMenuPermissionEntity;
import com.ims.exception.BusinessRuleViolationException;
import com.ims.exception.DuplicateResourceException;
import com.ims.exception.ResourceNotFoundException;
import com.ims.mapper.RoleMapper;
import com.ims.repository.security.MenuRepository;
import com.ims.repository.security.RoleMenuPermissionRepository;
import com.ims.repository.security.RoleRepository;
import com.ims.service.serviceInterface.role.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final MenuRepository menuRepository;
    private final RoleMenuPermissionRepository permissionRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional
    public RoleResponse createRole(RoleCreateRequest request) {
        String roleName = request.getName().trim().toUpperCase();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        if (roleRepository.existsByName(roleName)) {
            throw new DuplicateResourceException("Role '" + roleName + "' already exists");
        }

        RoleEntity role = RoleEntity.builder()
                .name(roleName)
                .description(request.getDescription())
                .active(true)
                .build();

        RoleEntity savedRole = roleRepository.save(role);

        // Populate default permissions for all menus with false flags
        List<MenuEntity> menus = menuRepository.findAll();
        for (MenuEntity menu : menus) {
            RoleMenuPermissionEntity perm = RoleMenuPermissionEntity.builder()
                    .role(savedRole)
                    .menu(menu)
                    .canView(false)
                    .canAdd(false)
                    .canEdit(false)
                    .canDelete(false)
                    .canPay(false)
                    .canExport(false)
                    .canChangeStatus(false)
                    .build();
            permissionRepository.save(perm);
            savedRole.getPermissions().add(perm);
        }

        return roleMapper.toResponse(savedRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse getRoleById(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return roleMapper.toResponse(role);
    }

    @Override
    @Transactional
    public RoleResponse updateRole(Long id, RoleUpdateRequest request) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        if (request.getActive() != null) {
            if ("ROLE_ADMIN".equalsIgnoreCase(role.getName()) && !request.getActive()) {
                throw new BusinessRuleViolationException("Cannot deactivate the system ADMIN role");
            }
            role.setActive(request.getActive());
        }

        RoleEntity savedRole = roleRepository.save(role);
        return roleMapper.toResponse(savedRole);
    }

    @Override
    @Transactional
    public void deleteRole(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if ("ROLE_ADMIN".equalsIgnoreCase(role.getName()) || "ROLE_STAFF".equalsIgnoreCase(role.getName())) {
            throw new BusinessRuleViolationException("Cannot delete standard system roles (ADMIN, STAFF)");
        }

        roleRepository.delete(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuResponse> getAllMenus() {
        return menuRepository.findByActiveTrueOrderByOrderIndexAsc().stream()
                .map(m -> MenuResponse.builder()
                        .id(m.getId())
                        .code(m.getCode())
                        .name(m.getName())
                        .route(m.getRoute())
                        .icon(m.getIcon())
                        .orderIndex(m.getOrderIndex())
                        .active(m.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleResponse updateRolePermissions(Long roleId, RolePermissionUpdateRequest request) {
        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        if ("ROLE_ADMIN".equalsIgnoreCase(role.getName())) {
            throw new BusinessRuleViolationException("Administrator permissions are fixed and cannot be revoked");
        }

        for (RolePermissionUpdateRequest.MenuPermissionItem item : request.getPermissions()) {
            MenuEntity menu = menuRepository.findById(item.getMenuId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu", "id", item.getMenuId()));

            RoleMenuPermissionEntity perm = permissionRepository.findByRoleIdAndMenuId(roleId, item.getMenuId())
                    .orElseGet(() -> RoleMenuPermissionEntity.builder()
                            .role(role)
                            .menu(menu)
                            .build());

            perm.setCanView(item.isCanView());
            perm.setCanAdd(item.isCanAdd());
            perm.setCanEdit(item.isCanEdit());
            perm.setCanDelete(item.isCanDelete());
            perm.setCanPay(item.isCanPay());
            perm.setCanExport(item.isCanExport());
            perm.setCanChangeStatus(item.isCanChangeStatus());

            permissionRepository.save(perm);
        }

        // Reload role with updated permissions
        RoleEntity updatedRole = roleRepository.findById(roleId).orElseThrow();
        return roleMapper.toResponse(updatedRole);
    }
}
