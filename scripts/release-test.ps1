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

Run-Step -Name "Ensure test target" -Command "npx clasp run ensureTestSpreadsheetCLI"
Run-Step -Name "Show targets" -Command "npx clasp run getSpreadsheetTargetsCLI"
Run-Step -Name "Smoke (test)" -Command "npx clasp run runSmokeTestsTestCLI"
Run-Step -Name "Mobile UAT (test)" -Command "npx clasp run runMobileUatCLI test"
Run-Step -Name "Integrity (test)" -Command "npx clasp run verifySheetIntegrityTestCLI"
Run-Step -Name "Safety gate (test)" -Command "npx clasp run runSafetyGateTestCLI"

Write-Host "`nTest release gate completed successfully."