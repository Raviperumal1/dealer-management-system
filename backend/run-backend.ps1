# Quick PowerShell launcher for Spring Boot Backend
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " AutoManage Pro DMS — Spring Boot Backend Launcher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Set Java 21 JDK Path if not already configured
if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Program Files\JetBrains\PyCharm 2025.3.3\jbr") {
        $env:JAVA_HOME = "C:\Program Files\JetBrains\PyCharm 2025.3.3\jbr"
        $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
        Write-Host "Using Java 21 JDK at: $env:JAVA_HOME" -ForegroundColor Green
    }
} else {
    Write-Host "Using configured JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
}

# Verify Java version
Write-Host "`nChecking Java Version:" -ForegroundColor Yellow
& "$env:JAVA_HOME\bin\java.exe" -version

Write-Host "`nStarting Spring Boot on http://localhost:8081/api/v1.0..." -ForegroundColor Green
Write-Host "Press Ctrl + C to stop the server.`n" -ForegroundColor Gray

# Launch application via Maven Wrapper
& ".\mvnw.cmd" spring-boot:run
