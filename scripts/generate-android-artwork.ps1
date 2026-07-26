$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'app-icon-512.png'
$resourceRoot = Join-Path $projectRoot 'android\app\src\main\res'
$source = [System.Drawing.Image]::FromFile($sourcePath)
$logo = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
for ($y = 0; $y -lt $source.Height; $y++) {
  for ($x = 0; $x -lt $source.Width; $x++) {
    $pixel = ([System.Drawing.Bitmap]$source).GetPixel($x, $y)
    $brightness = ($pixel.R + $pixel.G + $pixel.B) / 3
    $alpha = [Math]::Max(0, [Math]::Min(255, [Math]::Round((220 - $brightness) * 6)))
    $logo.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
  }
}

function Save-ScaledPng {
  param(
    [Parameter(Mandatory)][string]$Target,
    [Parameter(Mandatory)][int]$Width,
    [Parameter(Mandatory)][int]$Height,
    [System.Drawing.Image]$Image = $source
  )
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Save-SplashPng {
  param([Parameter(Mandatory)][string]$Target)
  $existing = [System.Drawing.Image]::FromFile($Target)
  try {
    $width = $existing.Width
    $height = $existing.Height
  } finally {
    $existing.Dispose()
  }

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F9F6F2'))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $size = [Math]::Round([Math]::Min($width, $height) * 0.5)
    $left = [Math]::Round(($width - $size) / 2)
    $top = [Math]::Round(($height - $size) / 2)
    $graphics.DrawImage($logo, $left, $top, $size, $size)
    $bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$legacySizes = @{
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}
$foregroundSizes = @{
  'mipmap-mdpi' = 108
  'mipmap-hdpi' = 162
  'mipmap-xhdpi' = 216
  'mipmap-xxhdpi' = 324
  'mipmap-xxxhdpi' = 432
}

foreach ($entry in $legacySizes.GetEnumerator()) {
  $directory = Join-Path $resourceRoot $entry.Key
  Save-ScaledPng -Target (Join-Path $directory 'ic_launcher.png') -Width $entry.Value -Height $entry.Value
  Save-ScaledPng -Target (Join-Path $directory 'ic_launcher_round.png') -Width $entry.Value -Height $entry.Value
}
foreach ($entry in $foregroundSizes.GetEnumerator()) {
  $directory = Join-Path $resourceRoot $entry.Key
  Save-ScaledPng -Target (Join-Path $directory 'ic_launcher_foreground.png') -Width $entry.Value -Height $entry.Value -Image $logo
}

Get-ChildItem -LiteralPath $resourceRoot -Recurse -Filter 'splash.png' |
  ForEach-Object { Save-SplashPng -Target $_.FullName }

$source.Dispose()
$logo.Dispose()
Write-Host 'Android launcher icons and splash screens generated.'
