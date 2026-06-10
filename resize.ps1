Add-Type -AssemblyName System.Drawing

$sourcePath = "d:\Koding\Projek\Self\ext\ms-word-ext\Skripshit\assets\download.png"
$targetDir = "d:\Koding\Projek\Self\ext\ms-word-ext\Skripshit\assets"

if (!(Test-Path $sourcePath)) {
    Write-Host "File download.png tidak ditemukan!"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

# Ukuran icon standar untuk MS Word Add-in
$sizes = @(16, 32, 64, 80, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Pengaturan agar kualitas gambarnya High Definition (HD)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    
    $outPath = Join-Path $targetDir "icon-$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Host "Berhasil membuat icon-$size.png (HD)"
}

# Membuat versi logo besar
$bmp = New-Object System.Drawing.Bitmap(300, 300)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 300, 300)
$g.Dispose()
$outPath = Join-Path $targetDir "logo-filled.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$img.Dispose()
Write-Host "Selesai membuat semua ukuran logo!"
