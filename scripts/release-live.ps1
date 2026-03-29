param(
  [string]$Description = "manual-release"
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host "`n==> $Name"
  Write-Host "    $Command"
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name (exit=$LASTEXITCODE)"
  }
}

Run-Step -Name "Push" -Command "echo y | npx clasp push"
Run-Step -Name "Smoke (live)" -Command "npx clasp run runSmokeTestsCLI"
Run-Step -Name "Mobile UAT (live)" -Command "npx clasp run runMobileUatCLI"
Run-Step -Name "Safety gate (live)" -Command "npx clasp run runSafetyGateCLI"
Run-Step -Name "Deploy" -Command "npx clasp deploy --description \"$Description\""
Run-Step -Name "Post-deploy (live)" -Command "npx clasp run postDeployCheckCLI"

Write-Host "`nRelease completed successfully."