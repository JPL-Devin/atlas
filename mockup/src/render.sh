#!/usr/bin/env bash
# Renders every mockup HTML in this directory to a PNG in mockup/.
# Requires Google Chrome / Chromium and Python + Pillow.
#
# Headless Chrome reserves ~87px of the requested window height for browser
# chrome, so we render taller and crop back to the mockup canvas size.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$(dirname "$here")"
chrome="${CHROME:-google-chrome}"
W=1600
H=1000
CHROME_UI=87

for f in "$here"/*.html; do
    name="$(basename "$f" .html)"
    png="$out/$name.png"
    "$chrome" --headless=new --disable-gpu --hide-scrollbars \
        --force-device-scale-factor=1 --window-size="$W,$((H + CHROME_UI))" \
        --virtual-time-budget=6000 \
        --screenshot="$png" "file://$f" 2>/dev/null
    python3 - "$png" "$W" "$H" <<'PY'
import sys
from PIL import Image
path, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
Image.open(path).convert('RGB').crop((0, 0, w, h)).save(path)
PY
    echo "rendered $png"
done
