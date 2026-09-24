#!/usr/bin/env python3
"""Combine a directional head with one immutable seated body."""

from pathlib import Path
import sys

from PIL import Image


if len(sys.argv) != 4:
    raise SystemExit("usage: compose-gaze-frame.py BODY.png HEAD_POSE.png OUTPUT.png")

body = Image.open(sys.argv[1]).convert("RGBA")
pose = Image.open(sys.argv[2]).convert("RGBA")
if body.size != pose.size:
    raise SystemExit("body and directional pose must use the same canvas")

# Keep the donor pose through the head and upper neck, then feather into the
# immutable body before the shoulders. Everything below the seam is identical.
mask = Image.new("L", body.size, 0)
pixels = mask.load()
for y in range(body.height):
    weight = 255 if y <= 170 else max(0, round(255 * (250 - y) / 80))
    for x in range(body.width):
        pixels[x, y] = weight

output = Image.composite(pose, body, mask)
target = Path(sys.argv[3])
target.parent.mkdir(parents=True, exist_ok=True)
output.save(target)
