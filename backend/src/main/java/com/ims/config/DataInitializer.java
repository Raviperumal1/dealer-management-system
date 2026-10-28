package com.ims.config;

import com.ims.entity.security.RoleEntity;
import com.ims.repository.security.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures system roles (ROLE_ADMIN, ROLE_STAFF) exist in the database.
 * User authentication and admin accounts are strictly managed in the database
 * and not auto-injected from environment files.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure Admin Role exists
        roleRepository.findByName("ROLE_ADMIN")
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

        log.info("System baseline roles verified. Authentication is driven purely by database user records.");
    }
}
