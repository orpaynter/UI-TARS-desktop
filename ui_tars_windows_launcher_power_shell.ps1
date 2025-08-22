# UI‑TARS Windows Launcher with OrPaynter Integration (PowerShell)
# Save this file as run-ui-tars.ps1 in the REPO ROOT (same folder as package.json)
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\run-ui-tars.ps1
# Optional parameters:
#   -SkipBuild: Skip workspace build for faster startup
#   -OrPaynterMode: Enable OrPaynter-specific features and validation
#   -SetupOrPaynter: Run OrPaynter integration setup wizard

#requires -Version 5.1
param(
  [switch]$SkipBuild,
  [switch]$OrPaynterMode,
  [switch]$SetupOrPaynter
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Cmd {
  param([Parameter(Mandatory)][string]$Command)
  Write-Host "\n>>> $Command" -ForegroundColor Cyan
  & cmd.exe /c $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $Command" }
}

function Ensure-RepoRoot {
  # Try to locate a package.json that looks like the monorepo root
  if (-not (Test-Path -LiteralPath './package.json')) {
    throw "Run this script from the UI-TARS repo root (folder containing package.json)."
  }
}

function Ensure-Pnpm {
  try {
    Write-Host "Ensuring pnpm 10.15.0 via Corepack..." -ForegroundColor Yellow
    Invoke-Cmd 'corepack prepare pnpm@10.15.0 --activate'
  } catch {
    Write-Warning "Corepack prepare failed or not needed; continuing. ($_ )"
  }
  Invoke-Cmd 'pnpm -v'
}

function Configure-ScriptShell {
  # Use cmd.exe for workspace scripts to avoid PowerShell 5 `&&` parsing issues
  Invoke-Cmd 'pnpm config set script-shell "cmd.exe"'
}

function Prepare-EnvFile {
  if ((Test-Path ./.env.example) -and -not (Test-Path ./.env)) {
    Copy-Item ./.env.example ./.env -Force
    Write-Host "Created .env from .env.example (review values if app asks)." -ForegroundColor Green
  }
  
  # OrPaynter-specific environment setup
  if ($OrPaynterMode -or $SetupOrPaynter) {
    Setup-OrPaynterEnvironment
  }
}

function Setup-OrPaynterEnvironment {
  Write-Host "Setting up OrPaynter environment configuration..." -ForegroundColor Magenta
  
  $envPath = "./.env"
  $envContent = Get-Content $envPath -ErrorAction SilentlyContinue
  
  # Check if OrPaynter variables exist
  $hasOrPaynterConfig = $envContent | Where-Object { $_ -match "ORPAYNTER_" }
  
  if (-not $hasOrPaynterConfig) {
    Write-Host "Adding OrPaynter configuration to .env file..." -ForegroundColor Yellow
    $orPaynterConfig = @(
      "",
      "# OrPaynter Platform Integration",
      "ORPAYNTER_API_BASE=https://api.orpaynter.com",
      "ORPAYNTER_TOKEN=your_orpaynter_token_here",
      "ORPAYNTER_ENVIRONMENT=development",
      "ORPAYNTER_ENABLE_AI=true",
      "ORPAYNTER_ENABLE_CLAIMS=true"
    )
    Add-Content -Path $envPath -Value $orPaynterConfig
    Write-Host "OrPaynter configuration added to .env. Please update with your actual credentials." -ForegroundColor Green
  }
}

function Validate-OrPaynterSetup {
  if (-not $OrPaynterMode) { return }
  
  Write-Host "Validating OrPaynter integration setup..." -ForegroundColor Magenta
  
  # Check for required OrPaynter packages
  $requiredPackages = @(
    "packages/agent-infra/mcp-orpaynter-claims",
    "packages/agent-infra/mcp-orpaynter-ai"
  )
  
  foreach ($package in $requiredPackages) {
    if (-not (Test-Path "$package/package.json")) {
      Write-Warning "OrPaynter package missing: $package"
      Write-Host "Run with -SetupOrPaynter to create missing packages." -ForegroundColor Yellow
    } else {
      Write-Host "✓ Found OrPaynter package: $package" -ForegroundColor Green
    }
  }
  
  # Validate environment variables
  $envContent = Get-Content "./.env" -ErrorAction SilentlyContinue
  $orPaynterToken = $envContent | Where-Object { $_ -match "ORPAYNTER_TOKEN=" } | Select-Object -First 1
  
  if ($orPaynterToken -and $orPaynterToken -notmatch "your_orpaynter_token_here") {
    Write-Host "✓ OrPaynter token configured" -ForegroundColor Green
  } else {
    Write-Warning "OrPaynter token not configured. Update ORPAYNTER_TOKEN in .env file."
  }
}

function Install-Workspace {
  Write-Host "Installing workspace dependencies (ignore scripts)..." -ForegroundColor Yellow
  Invoke-Cmd 'pnpm install --ignore-scripts'
}

function Build-Workspace {
  if ($SkipBuild) {
    Write-Host "Skipping build as requested (-SkipBuild)." -ForegroundColor Yellow
    return
  }

  Write-Host "Building workspace (tolerant)..." -ForegroundColor Yellow
  
  # Build OrPaynter packages first if in OrPaynter mode
  if ($OrPaynterMode) {
    Build-OrPaynterPackages
  }
  
  try {
    Invoke-Cmd 'pnpm -r run build --if-present'
  } catch {
    Write-Warning "Initial build failed; retrying without known flaky packages..."
    try {
      Invoke-Cmd 'pnpm -r --filter "!@agent-infra/create-new-mcp" --filter "!@ui-tars/utio" --filter "!@agent-infra/mcp-http-server" run build --if-present'
    } catch {
      Write-Warning "Tolerant build still failed. You can re-run with -SkipBuild to continue. ($_ )"
    }
  }
}

function Build-OrPaynterPackages {
  Write-Host "Building OrPaynter integration packages..." -ForegroundColor Magenta
  
  $orPaynterPackages = @(
    "@agent-infra/mcp-orpaynter-claims",
    "@agent-infra/mcp-orpaynter-ai"
  )
  
  foreach ($package in $orPaynterPackages) {
    try {
      Write-Host "Building $package..." -ForegroundColor Yellow
      Invoke-Cmd "pnpm --filter '$package' run build --if-present"
      Write-Host "✓ Successfully built $package" -ForegroundColor Green
    } catch {
      Write-Warning "Failed to build $package. Continuing with other packages..."
    }
  }
}

function Try-RunDesktop {
  # 1) Prefer conventional apps\desktop
  $desktopPath = Join-Path (Get-Location) 'apps/desktop'
  if (Test-Path "$desktopPath/package.json") {
    Write-Host "Detected apps/desktop. Launching dev..." -ForegroundColor Yellow
    try {
      Invoke-Cmd 'pnpm -C .\apps\desktop dev'
      return
    } catch {
      Write-Warning "apps/desktop dev failed; trying start..."
      Invoke-Cmd 'pnpm -C .\apps\desktop start'
      return
    }
  }

  # 2) Heuristic: any package with "desktop" in name
  Write-Host "Searching for a desktop-like package via workspace filter..." -ForegroundColor Yellow
  try {
    Invoke-Cmd 'pnpm --filter "*desktop*" dev'
    return
  } catch {
    Write-Warning "desktop dev failed; trying start..."
    try {
      Invoke-Cmd 'pnpm --filter "*desktop*" start'
      return
    } catch {
      Write-Warning "Could not auto-launch a desktop package. Listing runnable candidates:"
      try { Invoke-Cmd 'pnpm -r run | findstr /I "desktop electron app demo"' } catch { }
      throw "No obvious desktop package entrypoint found. Check scripts in apps/* or packages/* and run its dev/start manually."
    }
  }
}

# ---- Main ----
Ensure-RepoRoot
Ensure-Pnpm
Configure-ScriptShell
Prepare-EnvFile
Install-Workspace
Build-Workspace
Try-RunDesktop
