package com.ims.config;

import com.ims.entity.security.RoleEntity;
import com.ims.entity.security.UserEntity;
import com.ims.repository.security.RoleRepository;
import com.ims.repository.security.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-username:admin}")
    private String defaultAdminUsername;

    @Value("${app.admin.default-password:admin123}")
    private String defaultAdminPassword;

    @Value("${app.admin.default-email:admin@dealership.com}")
    private String defaultAdminEmail;

    @Value("${app.admin.default-fullname:System Administrator}")
    private String defaultAdminFullName;

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
        RoleEntity staffRole = roleRepository.findByName("ROLE_STAFF")
                .orElseGet(() -> roleRepository.save(RoleEntity.builder()
                        .name("ROLE_STAFF")
                        .description("Dealership operational staff")
                        .active(true)
                        .build()));

        // Provision Default Admin User if not present
        if (!userRepository.existsByUsername(defaultAdminUsername)) {
            UserEntity admin = UserEntity.builder()
                    .username(defaultAdminUsername)
                    .passwordHash(passwordEncoder.encode(defaultAdminPassword))
                    .fullName(defaultAdminFullName)
                    .email(defaultAdminEmail)
                    .phone("+91 9999999999")
                    .active(true)
                    .roles(new HashSet<>(Collections.singletonList(adminRole)))
                    .build();
            userRepository.save(admin);
            log.info("Initialized default administrator user: [{}]", defaultAdminUsername);
        }

        // Provision Default Staff User if not present
        if (!userRepository.existsByUsername("staff")) {
            UserEntity staff = UserEntity.builder()
                    .username("staff")
                    .passwordHash(passwordEncoder.encode("StaffSecure@2026!"))
                    .fullName("Dealership Staff Member")
                    .email("staff@dealership.com")
                    .phone("+91 8888888888")
                    .active(true)
                    .roles(new HashSet<>(Collections.singletonList(staffRole)))
                    .build();
            userRepository.save(staff);
            log.info("Initialized default operational staff user: [staff]");
        }
    }
}
