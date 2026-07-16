# Copy PNGs from pedal-sheet to VTT
param()

$src = "C:\Users\mikej\OneDrive\Documents\apps\pedal-sheet\public"
$dst = "vtt\public\images"

$portraitNames = @("kehrfuffle", "strider", "toern", "wendy")

$categories = @{
    battlemaps = @()
    portraits = @()
    tokens = @()
    items = @()
}

$count = 0

Get-ChildItem -Path $src -Filter "*.png" | ForEach-Object {
    $file = $_.Name
    if ($file -eq "icon.png" -or $file -eq "t_pin.png") { return }
    
    $base = $file -replace "\.png$", ""
    $destFolder = ""
    
    if ($file -like "*_enc.png") {
        $destFolder = "battlemaps"
    } elseif ($file -like "*_bm.png") {
        $destFolder = "tokens"
    } elseif ($portraitNames -contains $base.ToLower()) {
        $destFolder = "portraits"
    } else {
        $destFolder = "items"
    }
    
    $srcPath = Join-Path $src $file
    $dstPath = Join-Path $dst $destFolder $file
    $dstDir = Split-Path $dstPath -Parent
    
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    
    Copy-Item -Path $srcPath -Destination $dstPath -Force
    $categories[$destFolder] += "/images/$destFolder/$file"
    $count++
    Write-Host "OK: $file -> $destFolder/"
}

# Update manifest
$manifestPath = "vtt\public\image-manifest.json"
$existing = Get-Content $manifestPath -Raw | ConvertFrom-Json

foreach ($cat in $categories.Keys) {
    if ($categories[$cat].Count -gt 0) {
        $existing.$cat = @($categories[$cat] + @($existing.$cat)) | Select-Object -Unique
    }
}

$existing | ConvertTo-Json -Depth 3 | Set-Content $manifestPath

Write-Host "`nTotal: $count files copied"
Write-Host "Manifest updated."
foreach ($cat in $categories.Keys) {
    if ($categories[$cat].Count -gt 0) {
        Write-Host "  $cat : $($categories[$cat].Count)"
    }
}
