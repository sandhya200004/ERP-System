# TriVerse ERP - Backup Restoration Testing Script
# Tests database backup integrity by restoring to a test database
# Run monthly as per DATA_LIFECYCLE_POLICY.md requirements

param(
    [string]$BackupFile = "",
    [string]$TestDatabase = "triverse_erp_test_restore",
    [switch]$CleanupAfter = $true,
    [switch]$GenerateReport = $true
)

# Configuration
$PostgresHost = $env:DB_HOST ?? "localhost"
$PostgresPort = $env:DB_PORT ?? "5432"
$PostgresUser = $env:DB_USER ?? "postgres"
$PostgresPassword = $env:DB_PASSWORD
$ProductionDatabase = $env:DB_NAME ?? "triverse_erp"
$BackupDirectory = "N:\PROJECTS\TriVerse ERP\backend\backups"
$ReportDirectory = "N:\PROJECTS\TriVerse ERP\backend\backup-test-reports"

# Logging
$LogFile = Join-Path $ReportDirectory "backup-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$StartTime = Get-Date

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Create directories if they don't exist
if (-not (Test-Path $ReportDirectory)) {
    New-Item -ItemType Directory -Path $ReportDirectory -Force | Out-Null
}

Write-Log "=== TriVerse ERP Backup Restoration Test ===" "INFO"
Write-Log "Start Time: $StartTime" "INFO"

# Find most recent backup if not specified
if (-not $BackupFile) {
    Write-Log "No backup file specified, finding most recent backup..." "INFO"
    $BackupFile = Get-ChildItem -Path $BackupDirectory -Filter "*.backup" | 
                  Sort-Object LastWriteTime -Descending | 
                  Select-Object -First 1 -ExpandProperty FullName
    
    if (-not $BackupFile) {
        Write-Log "No backup files found in $BackupDirectory" "ERROR"
        exit 1
    }
}

if (-not (Test-Path $BackupFile)) {
    Write-Log "Backup file not found: $BackupFile" "ERROR"
    exit 1
}

Write-Log "Using backup file: $BackupFile" "INFO"
$BackupFileSize = (Get-Item $BackupFile).Length / 1MB
Write-Log "Backup file size: $([math]::Round($BackupFileSize, 2)) MB" "INFO"

# Set password for psql/pg_restore
$env:PGPASSWORD = $PostgresPassword

try {
    # Step 1: Drop test database if exists
    Write-Log "Dropping test database if exists..." "INFO"
    $DropCommand = "DROP DATABASE IF EXISTS $TestDatabase;"
    $DropCommand | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres 2>&1 | ForEach-Object { Write-Log $_ "DEBUG" }

    # Step 2: Create test database
    Write-Log "Creating test database: $TestDatabase" "INFO"
    $CreateCommand = "CREATE DATABASE $TestDatabase;"
    $CreateCommand | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres 2>&1 | ForEach-Object { Write-Log $_ "DEBUG" }

    # Step 3: Restore backup to test database
    Write-Log "Restoring backup to test database..." "INFO"
    $RestoreStartTime = Get-Date
    
    pg_restore -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $TestDatabase -v $BackupFile 2>&1 | 
        ForEach-Object { Write-Log $_ "DEBUG" }
    
    $RestoreDuration = (Get-Date) - $RestoreStartTime
    Write-Log "Restore completed in $([math]::Round($RestoreDuration.TotalSeconds, 2)) seconds" "INFO"

    # Step 4: Validate restored data
    Write-Log "Validating restored data..." "INFO"

    # Count rows in key tables
    $ValidationQueries = @{
        "users" = "SELECT COUNT(*) FROM users;"
        "companies" = "SELECT COUNT(*) FROM companies;"
        "employees" = "SELECT COUNT(*) FROM employees;"
        "customers" = "SELECT COUNT(*) FROM customers;"
        "invoices" = "SELECT COUNT(*) FROM invoices;"
        "audit_logs" = "SELECT COUNT(*) FROM audit_logs;"
    }

    $ValidationResults = @{}
    $ValidationPassed = $true

    foreach ($table in $ValidationQueries.Keys) {
        $query = $ValidationQueries[$table]
        $count = (psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $TestDatabase -t -c $query).Trim()
        
        if ($count -match '^\d+$') {
            $ValidationResults[$table] = [int]$count
            Write-Log "Table '$table': $count rows" "INFO"
        } else {
            Write-Log "Failed to validate table '$table'" "ERROR"
            $ValidationPassed = $false
        }
    }

    # Step 5: Compare with production (optional)
    Write-Log "Comparing with production database..." "INFO"
    
    $ProductionCounts = @{}
    foreach ($table in $ValidationQueries.Keys) {
        $query = $ValidationQueries[$table]
        $count = (psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $ProductionDatabase -t -c $query).Trim()
        
        if ($count -match '^\d+$') {
            $ProductionCounts[$table] = [int]$count
        }
    }

    # Check for data loss
    foreach ($table in $ValidationQueries.Keys) {
        if ($ValidationResults[$table] -lt $ProductionCounts[$table]) {
            $diff = $ProductionCounts[$table] - $ValidationResults[$table]
            Write-Log "WARNING: Table '$table' has $diff fewer rows than production" "WARN"
        } elseif ($ValidationResults[$table] -eq $ProductionCounts[$table]) {
            Write-Log "Table '$table': Row count matches production" "INFO"
        }
    }

    # Final result
    $EndTime = Get-Date
    $TotalDuration = $EndTime - $StartTime
    
    if ($ValidationPassed) {
        Write-Log "=== BACKUP RESTORATION TEST PASSED ===" "INFO"
    } else {
        Write-Log "=== BACKUP RESTORATION TEST FAILED ===" "ERROR"
    }
    
    Write-Log "Total Duration: $([math]::Round($TotalDuration.TotalMinutes, 2)) minutes" "INFO"

    # Generate report
    if ($GenerateReport) {
        $ReportFile = Join-Path $ReportDirectory "backup-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        
        $HtmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Backup Restoration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2c3e50; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .warn { color: orange; font-weight: bold; }
        .info-box { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>TriVerse ERP - Backup Restoration Test Report</h1>
    
    <div class="info-box">
        <h2>Test Summary</h2>
        <p><strong>Test Date:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p><strong>Backup File:</strong> $(Split-Path $BackupFile -Leaf)</p>
        <p><strong>Backup Size:</strong> $([math]::Round($BackupFileSize, 2)) MB</p>
        <p><strong>Restore Duration:</strong> $([math]::Round($RestoreDuration.TotalSeconds, 2)) seconds</p>
        <p><strong>Total Test Duration:</strong> $([math]::Round($TotalDuration.TotalMinutes, 2)) minutes</p>
        <p><strong>Result:</strong> <span class="$(if ($ValidationPassed) { 'pass' } else { 'fail' })">$(if ($ValidationPassed) { 'PASSED' } else { 'FAILED' })</span></p>
    </div>

    <h2>Table Row Counts</h2>
    <table>
        <thead>
            <tr>
                <th>Table Name</th>
                <th>Production Count</th>
                <th>Restored Count</th>
                <th>Difference</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
"@

        foreach ($table in $ValidationQueries.Keys | Sort-Object) {
            $prodCount = $ProductionCounts[$table]
            $restCount = $ValidationResults[$table]
            $diff = $restCount - $prodCount
            $status = if ($diff -eq 0) { 'Match' } elseif ($diff -lt 0) { 'Data Loss' } else { 'Extra Data' }
            $statusClass = if ($diff -eq 0) { 'pass' } elseif ($diff -lt 0) { 'fail' } else { 'warn' }
            
            $HtmlReport += @"
            <tr>
                <td>$table</td>
                <td>$prodCount</td>
                <td>$restCount</td>
                <td>$diff</td>
                <td class="$statusClass">$status</td>
            </tr>
"@
        }

        $HtmlReport += @"
        </tbody>
    </table>

    <h2>Log File</h2>
    <p>Full log available at: <code>$LogFile</code></p>
    
    <hr>
    <p style="color: #7f8c8d; font-size: 12px;">
        Generated by TriVerse ERP Automated Backup Testing System<br>
        As per DATA_LIFECYCLE_POLICY.md Section 5.1.3 - Backup Testing Requirements
    </p>
</body>
</html>
"@

        $HtmlReport | Out-File -FilePath $ReportFile -Encoding UTF8
        Write-Log "HTML report generated: $ReportFile" "INFO"
        
        # Open report in default browser
        Start-Process $ReportFile
    }

} catch {
    Write-Log "Error during backup restoration test: $_" "ERROR"
    Write-Log $_.Exception.StackTrace "ERROR"
    exit 1
} finally {
    # Cleanup test database
    if ($CleanupAfter) {
        Write-Log "Cleaning up test database..." "INFO"
        $DropCommand = "DROP DATABASE IF EXISTS $TestDatabase;"
        $DropCommand | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres 2>&1 | ForEach-Object { Write-Log $_ "DEBUG" }
    } else {
        Write-Log "Test database retained for manual inspection: $TestDatabase" "INFO"
    }
    
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Log "Backup restoration test completed" "INFO"
Write-Log "=== End of Test ===" "INFO"
