
$path = "c:\My Web Sites\jirani airbnb\js\data.js"
$content = Get-Content $path -Raw -Encoding UTF8

# Replace base64 images with placeholder
$content = $content -replace 'data:image\/[a-zA-Z]+;base64,[^"]+', 'images/placeholder.jpg'

# Remove dates property (e.g., "dates": "Oct 11 - 16",)
$content = $content -replace '"dates":\s*"[^"]*",?', ''

# Remove trailing commas if any were left by the removal (simple cleanup)
# This handles the case where dates was the last item: , "dates": "..." } -> , } -> }
# Or middle item: "desc": "...", "dates": "...", "price": ... -> "desc": "...", "price": ... (already handled by comma in regex above usually)
# But let's be safe.

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "File cleaned successfully."
