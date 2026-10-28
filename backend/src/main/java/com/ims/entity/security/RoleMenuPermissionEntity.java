package com.ims.entity.security;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "role_menu_permissions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_role_menu", columnNames = {"role_id", "menu_id"})
})
public class RoleMenuPermissionEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private RoleEntity role;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private MenuEntity menu;

    @Column(name = "can_view", nullable = false)
    @Builder.Default
    private boolean canView = false;

    @Column(name = "can_add", nullable = false)
    @Builder.Default
    private boolean canAdd = false;

    @Column(name = "can_edit", nullable = false)
    @Builder.Default
    private boolean canEdit = false;

    @Column(name = "can_delete", nullable = false)
    @Builder.Default
    private boolean canDelete = false;

    @Column(name = "can_pay", nullable = false)
    @Builder.Default
    private boolean canPay = false;

    @Column(name = "can_export", nullable = false)
    @Builder.Default
    private boolean canExport = false;

    @Column(name = "can_change_status", nullable = false)
    @Builder.Default
    private boolean canChangeStatus = false;
}
