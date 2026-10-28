package com.ims.security;

import com.ims.entity.security.MenuEntity;
import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.RoleMenuPermissionEntity;
import com.ims.repository.security.RoleMenuPermissionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthorizationTest {

    @Mock
    private RoleMenuPermissionRepository permissionRepository;

    @InjectMocks
    private PermissionService permissionService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Scenario 9: Unauthorized staff member is blocked from restricted settlement and admin actions")
    void testScenario9_StaffUnauthorizedOnSettlementAndAdmin() {
        // Setup SecurityContext with ROLE_STAFF
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "staff_john",
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_STAFF"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Staff permissions based on Slide 15 matrix:
        // Brokers menu: No access
        MenuEntity brokersMenu = MenuEntity.builder().code("BROKERS").name("Brokers & Settlement").build();
        RoleEntity staffRole = RoleEntity.builder().name("ROLE_STAFF").build();

        RoleMenuPermissionEntity brokersPermission = RoleMenuPermissionEntity.builder()
                .role(staffRole)
                .menu(brokersMenu)
                .canView(false)
                .canAdd(false)
                .canEdit(false)
                .canDelete(false)
                .canPay(false)
                .build();

        when(permissionRepository.findByRoleNames(Set.of("ROLE_STAFF")))
                .thenReturn(List.of(brokersPermission));

        // Assert: Staff CANNOT PAY or VIEW broker settlements
        boolean canPay = permissionService.hasPermission("BROKERS", "PAY");
        boolean canView = permissionService.hasPermission("BROKERS", "VIEW");

        assertFalse(canPay, "Staff must NOT have permission to PAY broker settlements");
        assertFalse(canView, "Staff must NOT have permission to VIEW broker settlements");
    }

    @Test
    @DisplayName("Admin Role: ROLE_ADMIN bypasses granular restrictions and has full access")
    void testAdminBypassesGranularRestrictions() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin",
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Even with no permissions queried, admin has full access
        boolean canPay = permissionService.hasPermission("BROKERS", "PAY");
        boolean canExport = permissionService.hasPermission("REPORTS", "EXPORT");
        boolean canManageUsers = permissionService.hasPermission("ADMIN", "ALL");

        assertTrue(canPay);
        assertTrue(canExport);
        assertTrue(canManageUsers);
        verify(permissionRepository, never()).findByRoleNames(any());
    }
}
