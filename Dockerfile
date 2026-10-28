# ==============================================================================
# Multi-stage Unified / Targetable Dockerfile (Outer Root Context)
# Allows building backend, frontend, or an all-in-one standalone container
# from the repository root:
#
#   docker build --target backend  -t dealership-backend:latest .
#   docker build --target frontend -t dealership-frontend:latest .
#   docker build --target standalone -t dealership-allinone:latest .
# ==============================================================================

# ------------------------------------------------------------------------------
# TARGET 1: Backend Builder & Runner
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache bash
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY backend/src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS backend
WORKDIR /app
RUN apk add --no-cache wget && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app
COPY --from=backend-builder /app/target/dealership-management-system-1.0.0.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
EXPOSE 8081
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:8081/api/v1.0/actuator/health || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# ------------------------------------------------------------------------------
# TARGET 2: Frontend Builder & Runner (Nginx)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ARG VITE_API_BASE_URL=/api/v1.0
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# ------------------------------------------------------------------------------
# TARGET 3: Standalone Full-Stack (Default Target)
# Embedded Spring Boot backend + static frontend hosted via Spring Boot or Nginx
# ------------------------------------------------------------------------------
FROM frontend AS standalone
