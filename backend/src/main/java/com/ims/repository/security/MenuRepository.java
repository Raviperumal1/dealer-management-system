package com.ims.repository.security;

import com.ims.entity.security.MenuEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<MenuEntity, Long> {
    Optional<MenuEntity> findByCode(String code);
    List<MenuEntity> findByActiveTrueOrderByOrderIndexAsc();
}
