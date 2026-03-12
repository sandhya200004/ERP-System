# Add Windows Firewall rule to allow Node.js on port 3000
# Run this script as Administrator

Write-Host "Adding firewall rule for Node.js Server on port 3000..." -ForegroundColor Yellow

# Remove existing rule if present
$existingRule = Get-NetFirewallRule -DisplayName "Node.js Server Port 3000" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -DisplayName "Node.js Server Port 3000"
    Write-Host "Removed existing firewall rule" -ForegroundColor Gray
}

# Add new inbound rule for port 3000
New-NetFirewallRule -DisplayName "Node.js Server Port 3000" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3000 `
    -Action Allow `
    -Profile Any `
    -Enabled True

Write-Host "Firewall rule added successfully!" -ForegroundColor Green
Write-Host "Port 3000 is now accessible from your local network" -ForegroundColor Green
