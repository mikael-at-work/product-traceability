$cssPath = Join-Path $PSScriptRoot 'css\styles.css'
$htmlPath = Join-Path $PSScriptRoot 'index.html'
$css = Get-Content -Path $cssPath -Raw
$css = $css -replace "font-family: 'IBM Plex Mono', monospace;", "font-family: 'Roboto', sans-serif;"
Set-Content -Path $cssPath -Value $css
$html = Get-Content -Path $htmlPath -Raw
$html = $html -replace "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap", "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Roboto:wght@400;500;600;700&display=swap"
Set-Content -Path $htmlPath -Value $html
Write-Output 'font replacement completed.'
