#!/usr/bin/env python3
"""Split a 4x2 directional gaze sheet without per-frame rescaling."""

from pathlib import Path
import sys

from PIL import Image


if len(sys.argv) != 3:
    raise SystemExit("usage: split-gaze-sheet.py INPUT.png OUTPUT_DIR")

sheet = Image.open(sys.argv[1]).convert("RGBA")
if sheet.width % 4 or sheet.height % 2:
    raise SystemExit("gaze sheet must divide evenly into a 4x2 grid")

cell_width = sheet.width // 4
cell_height = sheet.height // 2
output_dir = Path(sys.argv[2])
output_dir.mkdir(parents=True, exist_ok=True)

for index in range(8):
    column = index % 4
    row = index // 4
    frame = sheet.crop((
        column * cell_width,
        row * cell_height,
        (column + 1) * cell_width,
        (row + 1) * cell_height,
    ))
    frame.save(output_dir / f"frame-{index:02d}.png")
