# DEALEROS Database Backup Script
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\backup_db.ps1
# Environment variables used (with sensible defaults):
#   DB_HOST (default: localhost)
#   DB_PORT (default: 3306)
#   DB_NAME (default: dealership_db)
#   DB_USER (default: root)
#   DB_PASSWORD (if set, uses it; otherwise prompts or reads from MYSQL_PWD)
#   BACKUP_DIR (default: .\backups)
#   RETENTION_DAYS (default: 30)

[CmdletBinding()]
param(
    [string]$HostName = $env:DB_HOST,
    [string]$Port = $env:DB_PORT,
    [string]$Database = $env:DB_NAME,
    [string]$User = $env:DB_USER,
    [string]$BackupDir = $env:BACKUP_DIR,
    [int]$RetentionDays = 30
)

if (-not $HostName) { $HostName = "localhost" }
if (-not $Port) { $Port = "3306" }
if (-not $Database) { $Database = "dealership_db" }
if (-not $User) { $User = "root" }
if (-not $BackupDir) { $BackupDir = Join-Path $PSScriptRoot "..\backups" }

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[INFO] Created backup directory at: $BackupDir" -ForegroundColor Cyan
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "$($Database)_$Timestamp.sql"
$GzFile = "$BackupFile.gz"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " DEALEROS Enterprise Database Backup Procedure" -ForegroundColor Green
Write-Host " Target DB: $Database on $HostName`:$Port" -ForegroundColor Green
Write-Host " Output:    $BackupFile" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# Check for mysqldump executable
$mysqldump = Get-Command "mysqldump" -ErrorAction SilentlyContinue
if (-not $mysqldump) {
    # Check default MySQL install locations on Windows
    $commonPaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        "C:\tools\mysql\bin\mysqldump.exe"
    )
    foreach ($p in $commonPaths) {
        if (Test-Path $p) {
            $mysqldump = $p
            break
        }
    }
}

if (-not $mysqldump) {
    Write-Error "[FATAL] 'mysqldump' utility could not be found in PATH or standard MySQL paths. Please install MySQL client tools."
    exit 1
}

Write-Host "[STEP 1/3] Executing consistent InnoDB snapshot dump..." -ForegroundColor Yellow
$dumpArgs = @(
    "--host=$HostName",
    "--port=$Port",
    "--user=$User",
    "--single-transaction",
    "--quick",
    "--triggers",
    "--routines",
    "--default-character-set=utf8mb4",
    "--result-file=$BackupFile",
    $Database
)

& $mysqldump @dumpArgs

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $BackupFile)) {
    Write-Error "[ERROR] Database backup failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}

$fileSize = (Get-Item $BackupFile).Length
Write-Host "[STEP 2/3] Snapshot dump completed successfully. File size: $([math]::Round($fileSize / 1KB, 2)) KB." -ForegroundColor Green

# Retention policy enforcement
Write-Host "[STEP 3/3] Enforcing retention policy: keeping last $RetentionDays days..." -ForegroundColor Yellow
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "$($Database)_*.sql*" | Where-Object { $_.CreationTime -lt $cutoff } | ForEach-Object {
    Write-Host "[CLEANUP] Removing expired backup: $($_.Name)" -ForegroundColor DarkGray
    Remove-Item $_.FullName -Force
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Backup verified and archived at: $BackupFile" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
