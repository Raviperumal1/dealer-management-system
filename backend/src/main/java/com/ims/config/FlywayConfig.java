package com.ims.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("Running Flyway repair to heal any previously failed migrations...");
            try {
                flyway.repair();
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue (ignoring): {}", e.getMessage());
            }
            log.info("Executing Flyway migrate...");
            flyway.migrate();
        };
    }
}
