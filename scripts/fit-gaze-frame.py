#!/usr/bin/env python3
"""Fit one complete gaze pose onto the runtime canvas without distortion."""

from pathlib import Path
import sys
from collections import deque

from PIL import Image


if len(sys.argv) != 3:
    raise SystemExit("usage: fit-gaze-frame.py INPUT.png OUTPUT.png")

source = Image.open(sys.argv[1]).convert("RGBA")
alpha = source.getchannel("A")
width, height = source.size
visible = bytearray(value >= 32 for value in alpha.getdata())
seen = bytearray(width * height)
largest = []
for start, is_visible in enumerate(visible):
    if not is_visible or seen[start]:
        continue
    component = []
    queue = deque([start])
    seen[start] = 1
    while queue:
        index = queue.popleft()
        component.append(index)
        x = index % width
        y = index // width
        for neighbor in (
            index - 1 if x else -1,
            index + 1 if x + 1 < width else -1,
            index - width if y else -1,
            index + width if y + 1 < height else -1,
        ):
            if neighbor >= 0 and visible[neighbor] and not seen[neighbor]:
                seen[neighbor] = 1
                queue.append(neighbor)
    if len(component) > len(largest):
        largest = component

original_alpha = alpha.tobytes()
clean_alpha = bytearray(width * height)
for index in largest:
    clean_alpha[index] = original_alpha[index]
source.putalpha(Image.frombytes("L", source.size, bytes(clean_alpha)))
bounds = source.getchannel("A").getbbox()
if not bounds:
    raise SystemExit("input has no visible subject")

subject = source.crop(bounds)
target_height = 430
scale = target_height / subject.height
target_width = round(subject.width * scale)
subject = subject.resize((target_width, target_height), Image.Resampling.LANCZOS)

canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
left = (canvas.width - target_width) // 2
top = 462 - target_height
canvas.alpha_composite(subject, (left, top))

target = Path(sys.argv[2])
target.parent.mkdir(parents=True, exist_ok=True)
canvas.save(target)
