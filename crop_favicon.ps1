Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\My Web Sites\jirani airbnb\images\favicon.png"
$destPath = "c:\My Web Sites\jirani airbnb\images\favicon_zoomed.png"

echo "Loading image from $sourcePath..."
if (-not (Test-Path $sourcePath)) {
    echo "Error: Source file not found!"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)
$width = $img.Width
$height = $img.Height

echo "Original Size: $width x $height"

# Calculate crop rectangle to remove 25% from each side (Zoom 2x)
$cropX = [int]($width * 0.25)
$cropY = [int]($height * 0.25)
$cropWidth = [int]($width * 0.5)
$cropHeight = [int]($height * 0.5)

echo "Cropping to: x=$cropX, y=$cropY, w=$cropWidth, h=$cropHeight"

$rect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropWidth, $cropHeight
$cropped = $img.Clone($rect, $img.PixelFormat)

echo "Saving zoomed image to $destPath..."
$cropped.Save($destPath)

$img.Dispose()
$cropped.Dispose()

echo "Replacing original file..."
Copy-Item $destPath $sourcePath -Force
Remove-Item $destPath

echo "Done!"
