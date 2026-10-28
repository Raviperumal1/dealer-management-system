# ==============================================================================
# Multi-stage Dockerfile for Dealership Management System Backend
# Framework: Spring Boot 3.4.2 | Java 21 | Alpine Linux
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package JAR
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install curl for wrapper downloads or health scripts if needed
RUN apk add --no-cache bash

# Copy Maven wrapper and POM first to leverage Docker layer caching for dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy application source code
COPY src ./src

# Build production JAR skipping test execution (tests run in CI/CD pipeline)
RUN ./mvnw clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install wget for container healthcheck
RUN apk add --no-cache wget

# Create secure non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create uploads storage directory with appropriate non-root permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy compiled executable JAR from builder stage
COPY --from=builder /app/target/dealership-management-system-1.0.0.jar app.jar
RUN chown appuser:appgroup app.jar

# Drop privileges to non-root user
USER appuser

# Expose backend REST API port
EXPOSE 8081

# Default JVM memory settings (Optimized G1GC for containers)
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Container healthcheck using Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:8081/api/v1.0/actuator/health || exit 1

# Start Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
