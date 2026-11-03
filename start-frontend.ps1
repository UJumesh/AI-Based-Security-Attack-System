param([int]$BackendPort = 8017, [int]$Port = 5177)
$ErrorActionPreference = 'Stop'
$env:VITE_API_BASE_URL = "http://127.0.0.1:$BackendPort"
Push-Location -LiteralPath (Join-Path $PSScriptRoot 'frontend-ui')
try { & npm run dev -- --host 127.0.0.1 --port $Port --strictPort }
finally { Pop-Location }
