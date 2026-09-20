$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      BookishAI Environment Setup (Win)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Node.js
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js (>= 22.13.0) from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

$nodeVer = node -v
Write-Host "   -> Node.js version $nodeVer detected." -ForegroundColor Green

# 2. Check / Install pnpm
Write-Host "[2/6] Checking pnpm package manager..." -ForegroundColor Yellow
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "   -> pnpm not found. Installing pnpm globally..." -ForegroundColor Yellow
    npm install -g pnpm
} else {
    $pnpmVer = pnpm -v
    Write-Host "   -> pnpm version $pnpmVer detected." -ForegroundColor Green
}

# 3. Install Node.js dependencies
Write-Host "[3/6] Installing project dependencies with pnpm..." -ForegroundColor Yellow
pnpm install

# 4. Check / Install Ollama
Write-Host "[4/6] Checking Ollama installation..." -ForegroundColor Yellow
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "   -> Ollama is not installed on this system." -ForegroundColor Yellow
    Write-Host "   -> Downloading Ollama Windows Installer..." -ForegroundColor Yellow
    $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
    $installerPath = "$env:TEMP\OllamaSetup.exe"
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
        Write-Host "   -> Launching OllamaSetup.exe. Please complete the installer dialog..." -ForegroundColor Green
        Start-Process -FilePath $installerPath -Wait
    } catch {
        Write-Host "WARNING: Auto-download of Ollama setup failed. Please manually download Ollama from https://ollama.com/download" -ForegroundColor Red
    }
} else {
    Write-Host "   -> Ollama binary detected." -ForegroundColor Green
}

# 5. Ensure Ollama server daemon is running
Write-Host "[5/6] Verifying Ollama service..." -ForegroundColor Yellow
$ollamaRunning = $false
try {
    $res = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -ErrorAction Stop
    $ollamaRunning = $true
} catch {
    $ollamaRunning = $false
}

if (-not $ollamaRunning) {
    Write-Host "   -> Ollama service is not running. Starting background daemon..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 4
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -ErrorAction Stop
        Write-Host "   -> Ollama daemon successfully started." -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Could not connect to Ollama at http://localhost:11434. Make sure Ollama application is launched." -ForegroundColor Red
    }
} else {
    Write-Host "   -> Ollama service is active at http://localhost:11434." -ForegroundColor Green
}

# 6. Pull & Configure required models
Write-Host "[6/6] Pulling and setting up local models..." -ForegroundColor Yellow

Write-Host "   -> Pulling base model qwen3:1.7b..." -ForegroundColor Green
ollama pull qwen3:1.7b

if (Test-Path "Modelfile.qwen3-8k") {
    Write-Host "   -> Creating custom qwen3:1.7b-8k model from Modelfile.qwen3-8k..." -ForegroundColor Green
    ollama create qwen3:1.7b-8k -f Modelfile.qwen3-8k
}

Write-Host "   -> Pulling light model qwen2.5:0.5b..." -ForegroundColor Green
ollama pull qwen2.5:0.5b

Write-Host "   -> Pulling embedding model nomic-embed-text..." -ForegroundColor Green
ollama pull nomic-embed-text

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SUCCESS: BookishAI setup completed!      " -ForegroundColor Green
Write-Host " You can now start the stack by running:  " -ForegroundColor Green
Write-Host "    pnpm run project                      " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
