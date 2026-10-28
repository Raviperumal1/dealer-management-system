package com.ims.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Dynamic EnvironmentPostProcessor that automatically discovers, parses,
 * and loads .env files into the Spring Boot Environment at startup before
 * any beans or datasource connections are initialized.
 * 
 * Lookup Order:
 * 1. Current working directory .env (e.g. backend/.env)
 * 2. Parent workspace directory .env (e.g. root .env)
 * 3. Fallback to existing System / Environment properties
 */
@Slf4j
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envProperties = new HashMap<>();

        // Potential paths to search for .env files
        File[] candidateFiles = new File[]{
                new File(".env"),
                new File("../.env"),
                new File("backend/.env")
        };

        for (File file : candidateFiles) {
            if (file.exists() && file.isFile() && file.canRead()) {
                log.info("Loading dynamic environment variables from: {}", file.getAbsolutePath());
                loadEnvFile(file, envProperties);
                break; // First matching .env file takes precedence
            }
        }

        if (!envProperties.isEmpty()) {
            // Register as high-priority PropertySource so ${VAR} placeholders in application*.yml resolve dynamically
            environment.getPropertySources().addFirst(new MapPropertySource("dynamicDotenvProperties", envProperties));
            log.info("Successfully loaded {} dynamic properties from .env file into Spring Environment", envProperties.size());
        } else {
            log.debug("No local .env file found; relying on container/system environment variables");
        }
    }

    private void loadEnvFile(File file, Map<String, Object> targetMap) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Skip empty lines and comment lines
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int eqIdx = line.indexOf('=');
                if (eqIdx > 0) {
                    String key = line.substring(0, eqIdx).trim();
                    String value = line.substring(eqIdx + 1).trim();

                    // Strip surrounding quotes if present (e.g. "value" or 'value')
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        if (value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        }
                    }

                    // Only set if not already present in System.getenv() to honor external overrides
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        targetMap.put(key, value);
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Failed to read .env file at {}: {}", file.getAbsolutePath(), e.getMessage());
        }
    }
}
