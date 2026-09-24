#!/usr/bin/env python3
"""Create a transparent gaze-sheet source from the approved reference art."""

from pathlib import Path
import sys

from PIL import Image
from rembg import remove


if len(sys.argv) != 3:
    raise SystemExit("usage: remove-gaze-background-ai.py INPUT.png OUTPUT.png")

source = Path(sys.argv[1])
target = Path(sys.argv[2])
target.parent.mkdir(parents=True, exist_ok=True)
intermediate = remove(source.read_bytes(), alpha_matting=True)
target.write_bytes(intermediate)

# The model leaves a translucent version of the original studio backdrop around
# an otherwise complete cat silhouette. Desktop-pet sprites need a hard alpha
# edge; retain only confident foreground pixels to avoid brown haze in the UI.
image = Image.open(target).convert("RGBA")
alpha = image.getchannel("A").point(lambda value: 255 if value >= 200 else 0)
image.putalpha(alpha)
image.save(target)
