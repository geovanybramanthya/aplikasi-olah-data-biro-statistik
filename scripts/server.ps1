$port = 4173
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$distPath = Join-Path $projectRoot "dist"

if (-not (Test-Path $distPath)) {
    $distPath = Join-Path (Get-Location) "dist"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BIRO STATISTIK BEM UNIVERSITAS DIPONEGORO 2026          " -ForegroundColor Yellow
Write-Host "  Survey Analytics & Visualization Platform (Offline)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Menjalankan server lokal di http://localhost:$port/ ..." -ForegroundColor Green
Write-Host "Tekan Ctrl + C di jendela ini untuk menghentikan server." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq '/') {
            $urlPath = "index.html"
        }

        # Security check: prevent directory traversal
        $fullPath = [System.IO.Path]::GetFullPath((Join-Path $distPath $urlPath))
        $basePath = [System.IO.Path]::GetFullPath($distPath)

        if ($fullPath.StartsWith($basePath) -and (Test-Path $fullPath -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".json" { "application/json" }
                ".ico"  { "image/x-icon" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # SPA Fallback to index.html
            $indexPath = Join-Path $distPath "index.html"
            if (Test-Path $indexPath) {
                $bytes = [System.IO.File]::ReadAllBytes($indexPath)
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
            }
        }
        $response.Close()
    }
} catch {
    Write-Host "Server berhenti: $_" -ForegroundColor Yellow
} finally {
    if ($listener -ne $null -and $listener.IsListening) {
        $listener.Stop()
        $listener.Close()
    }
}
