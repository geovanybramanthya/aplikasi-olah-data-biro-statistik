$ErrorActionPreference = "Stop"

$workspace = "C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app"
$zipDownloadsPrimary = "C:\Users\geova\Downloads\BEM_UNDIP_Statistik_Survey_Platform.zip"
$zipDownloadsLegacy = "C:\Users\geova\Downloads\BEM_UNDIP_Statistika_Survey_Platform.zip"
$zipLocalPrimary = Join-Path $workspace "BEM_UNDIP_Statistik_Survey_Platform.zip"
$zipLocalLegacy = Join-Path $workspace "BEM_UNDIP_Statistika_Survey_Platform.zip"

if (Test-Path $zipDownloadsPrimary) { Remove-Item $zipDownloadsPrimary -Force }
if (Test-Path $zipDownloadsLegacy) { Remove-Item $zipDownloadsLegacy -Force }
if (Test-Path $zipLocalPrimary) { Remove-Item $zipLocalPrimary -Force }
if (Test-Path $zipLocalLegacy) { Remove-Item $zipLocalLegacy -Force }

# Create a clean temporary staging directory
$stageDir = Join-Path $env:TEMP "bem_undip_stat_app_staging"
if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
New-Item -ItemType Directory -Path $stageDir | Out-Null

$appFolder = Join-Path $stageDir "BEM_UNDIP_Statistik_Survey_Platform"
New-Item -ItemType Directory -Path $appFolder | Out-Null

Write-Host "Menyalin file ke staging directory..." -ForegroundColor Cyan

# Directories to copy
$dirsToCopy = @("dist", "src", "public", "contoh_data_survei", "scripts")
foreach ($d in $dirsToCopy) {
    $src = Join-Path $workspace $d
    if (Test-Path $src) {
        $dest = Join-Path $appFolder $d
        Copy-Item -Path $src -Destination $dest -Recurse -Force
    }
}

# Remove export_demo_csv.cjs from scripts if unnecessary or keep it (it is tiny, keeping is fine)
# Files to copy
$filesToCopy = @(
    "Buka_Aplikasi.bat",
    "PANDUAN_PENGGUNAAN_OFFLINE.txt",
    "README.md",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "index.html",
    ".gitignore"
)

foreach ($f in $filesToCopy) {
    $src = Join-Path $workspace $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $appFolder -Force
    }
}

Write-Host "Membuat arsip ZIP..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression.FileSystem

[System.IO.Compression.ZipFile]::CreateFromDirectory($appFolder, $zipDownloadsPrimary, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Copy-Item $zipDownloadsPrimary $zipLocalPrimary -Force
Copy-Item $zipDownloadsPrimary $zipDownloadsLegacy -Force
Copy-Item $zipDownloadsPrimary $zipLocalLegacy -Force

# Clean up stageDir
Remove-Item $stageDir -Recurse -Force

Write-Host "Selesai! ZIP berhasil dibuat:" -ForegroundColor Green
Get-Item $zipDownloadsPrimary | Select-Object FullName, @{Name="SizeMB";Expression={[math]::round($_.Length/1MB, 2)}}
Get-Item $zipDownloadsLegacy | Select-Object FullName, @{Name="SizeMB";Expression={[math]::round($_.Length/1MB, 2)}}
