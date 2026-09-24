#!/usr/bin/env python3
"""Remove low-confidence translucent backdrop left by subject extraction."""

from pathlib import Path
import sys

from PIL import Image


if len(sys.argv) != 3:
    raise SystemExit("usage: harden-sprite-alpha.py INPUT.png OUTPUT.png")

source = Image.open(sys.argv[1]).convert("RGBA")
alpha = source.getchannel("A").point(lambda value: 255 if value >= 200 else 0)
source.putalpha(alpha)
target = Path(sys.argv[2])
target.parent.mkdir(parents=True, exist_ok=True)
source.save(target)
