package com.ims.repository.security;

import com.ims.entity.security.RoleMenuPermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleMenuPermissionRepository extends JpaRepository<RoleMenuPermissionEntity, Long> {
    List<RoleMenuPermissionEntity> findByRoleId(Long roleId);
    Optional<RoleMenuPermissionEntity> findByRoleIdAndMenuId(Long roleId, Long menuId);

    @Query("SELECT p FROM RoleMenuPermissionEntity p WHERE p.role.name IN :roleNames")
    List<RoleMenuPermissionEntity> findByRoleNames(@Param("roleNames") Set<String> roleNames);
}
