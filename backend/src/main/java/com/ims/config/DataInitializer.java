package com.ims.config;

import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.UserEntity;
import com.ims.repository.security.RoleRepository;
import com.ims.repository.security.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures system roles (ROLE_ADMIN, ROLE_STAFF) exist in the database
 * and ensures the primary admin user is mapped to ROLE_ADMIN.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure Admin Role exists
        RoleEntity adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder()
                        .name("ROLE_ADMIN")
                        .description("Administrator with full system privileges")
                        .active(true)
                        .build()));

        // Ensure Staff Role exists
        roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder()
                        .name("ROLE_STAFF")
                        .description("Dealership operational staff")
                        .active(true)
                        .build()));

        // Ensure admin user has ROLE_ADMIN mapped
        userRepository.findByUsername("admin").ifPresent(adminUser -> {
            if (adminUser.getRoles() == null || adminUser.getRoles().stream().noneMatch(r -> "ROLE_ADMIN".equals(r.getName()))) {
                adminUser.getRoles().add(adminRole);
                userRepository.save(adminUser);
                log.info("Assigned ROLE_ADMIN to primary admin user.");
            }
        });

        log.info("System baseline roles and admin assignments verified.");
    }
}
