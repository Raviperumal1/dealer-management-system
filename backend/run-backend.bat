@echo off
title AutoManage Pro DMS - Spring Boot Backend
echo ==========================================================
echo  AutoManage Pro DMS - Spring Boot Backend Launcher
echo ==========================================================

REM Set Java 21 JDK Path
set "JAVA_HOME=C:\Program Files\JetBrains\PyCharm 2025.3.3\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Using Java 21 from: %JAVA_HOME%
echo.
"%JAVA_HOME%\bin\java.exe" -version
echo.
echo Starting Spring Boot on http://localhost:8081/api/v1.0 ...
echo Press Ctrl + C to stop the server.
echo.

call .\mvnw.cmd spring-boot:run
pause
