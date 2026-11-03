param(
    [string]$ArtifactRoot = 'D:\College\3rd Year\5th sam\Desgine P\Desgine Project\AI-Based-Security-Attack-System',
    [int]$Port = 8017,
    [int]$FrontendPort = 5177
)
$ErrorActionPreference = 'Stop'
$artifactPath = (Resolve-Path -LiteralPath $ArtifactRoot).Path
$envPath = Join-Path $artifactPath '.env'
if (-not (Test-Path -LiteralPath $envPath)) { throw 'The original project .env is missing.' }
$env:SECURITY_ARTIFACT_ROOT = $artifactPath
$env:SECURITY_ENV_FILE = $envPath
$env:CORS_ORIGINS = "http://127.0.0.1:$FrontendPort,http://localhost:$FrontendPort"
$env:PYTHONDONTWRITEBYTECODE = '1'
Push-Location -LiteralPath $PSScriptRoot
try { & python -m uvicorn backend.app.main:app --host 127.0.0.1 --port $Port }
finally { Pop-Location }
