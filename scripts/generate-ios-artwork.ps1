$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'app-icon-512.png'
$assetRoot = Join-Path $projectRoot 'ios\App\App\Assets.xcassets'
$iconPath = Join-Path $assetRoot 'AppIcon.appiconset\AppIcon-512@2x.png'
$splashRoot = Join-Path $assetRoot 'Splash.imageset'

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
$logo = New-Object System.Drawing.Bitmap(
  $source.Width,
  $source.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)

for ($y = 0; $y -lt $source.Height; $y++) {
  for ($x = 0; $x -lt $source.Width; $x++) {
    $pixel = $source.GetPixel($x, $y)
    $brightness = ($pixel.R + $pixel.G + $pixel.B) / 3
    $alpha = [Math]::Max(0, [Math]::Min(255, [Math]::Round((220 - $brightness) * 6)))
    $logo.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
  }
}

function Save-OpaqueIcon {
  param([Parameter(Mandatory)][string]$Target)

  $bitmap = New-Object System.Drawing.Bitmap(
    1024,
    1024,
    [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($source, 0, 0, 1024, 1024)
    $bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Save-Splash {
  param([Parameter(Mandatory)][string]$Target)

  $bitmap = New-Object System.Drawing.Bitmap(
    2732,
    2732,
    [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F9F6F2'))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $size = [Math]::Round(2732 * 0.42)
    $offset = [Math]::Round((2732 - $size) / 2)
    $graphics.DrawImage($logo, $offset, $offset, $size, $size)
    $bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Save-OpaqueIcon -Target $iconPath
Get-ChildItem -LiteralPath $splashRoot -Filter 'splash-2732x2732*.png' |
  ForEach-Object { Save-Splash -Target $_.FullName }

$source.Dispose()
$logo.Dispose()
Write-Host 'iOS app icon and splash screens generated.'
