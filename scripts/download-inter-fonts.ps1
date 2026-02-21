# Download Inter Latin 300, 400, 500 woff2 from jsDelivr (fontsource) into public/assets/fonts/
$base = "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files"
$outDir = Join-Path (Split-Path $PSScriptRoot) "public\assets\fonts"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$files = @(
  @{ Name = "inter-latin-300-normal.woff2"; Url = "$base/inter-latin-300-normal.woff2" },
  @{ Name = "inter-latin-400-normal.woff2"; Url = "$base/inter-latin-400-normal.woff2" },
  @{ Name = "inter-latin-500-normal.woff2"; Url = "$base/inter-latin-500-normal.woff2" }
)
foreach ($f in $files) {
  Write-Host "Downloading $($f.Name)..."
  Invoke-WebRequest -Uri $f.Url -OutFile (Join-Path $outDir $f.Name) -UseBasicParsing
}
Write-Host "Done. Inter fonts in $outDir"
