# Multi-stage Dockerfile for Dealership Management System

# Stage 1: Build application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and build package
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Production Runtime
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directory for uploads and permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy built JAR from builder
COPY --from=builder /app/target/dealership-management-system-1.0.0.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8081

ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
