Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\My Web Sites\jirani airbnb\images\favicon.png"
$destPath = "c:\My Web Sites\jirani airbnb\images\favicon_square.png"

if (-not (Test-Path $sourcePath)) {
    echo "Error: Source file not found!"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)
$width = $img.Width
$height = $img.Height

echo "Current Size: $width x $height"

# Determine square size (min of width/height)
$size = [Math]::Min($width, $height)

# Calculate center crop
$x = [int](($width - $size) / 2)
$y = [int](($height - $size) / 2)

echo "Cropping to Square: Size=$size, X=$x, Y=$y"

$rect = New-Object System.Drawing.Rectangle $x, $y, $size, $size
$cropped = $img.Clone($rect, $img.PixelFormat)

# Save
$cropped.Save($destPath)

$img.Dispose()
$cropped.Dispose()

# Overwrite original
Copy-Item $destPath $sourcePath -Force
Remove-Item $destPath

echo "Done! Favicon is now square."
