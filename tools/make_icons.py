# -*- coding: utf-8 -*-
"""
Generates the launcher icon set.

The mark is three stacked bars — a timetable — with the middle one picked out in
mint: "this is the lesson happening now", which is the whole point of the app.
Kept to three shapes so it still reads at 48 px in the launcher.

Run:  python tools/make_icons.py
"""
import os

from PIL import Image, ImageDraw

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "images"))

INDIGO_TOP = (78, 112, 255)
INDIGO_BOTTOM = (46, 74, 214)
MINT = (72, 209, 136)
WHITE = (255, 255, 255)

# Bar layout inside a 100x100 glyph box: (y, width, is_accent)
BARS = [(16, 76, False), (43, 100, True), (70, 58, False)]
BAR_H = 15
BAR_R = 7


def gradient(size: int) -> Image.Image:
    """Vertical indigo gradient, drawn once per canvas size."""
    img = Image.new("RGB", (1, size))
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        px[0, y] = tuple(
            round(INDIGO_TOP[i] + (INDIGO_BOTTOM[i] - INDIGO_TOP[i]) * t) for i in range(3)
        )
    return img.resize((size, size), Image.NEAREST).convert("RGBA")


def draw_glyph(canvas: Image.Image, box: float, monochrome: bool = False) -> None:
    """Draws the mark centred on `canvas`, occupying `box` fraction of its width."""
    size = canvas.size[0]
    side = size * box
    left = (size - side) / 2
    top = (size - side) / 2
    unit = side / 100.0

    # Supersample the glyph so the rounded caps stay smooth at every export size.
    scale = 4
    layer = Image.new("RGBA", (int(side * scale), int(side * scale)), (0, 0, 0, 0))
    pen = ImageDraw.Draw(layer)

    for y, width, accent in BARS:
        x0 = 0
        x1 = width * unit * scale
        y0 = y * unit * scale
        y1 = (y + BAR_H) * unit * scale
        colour = WHITE if (monochrome or not accent) else MINT
        alpha = 255 if (accent or monochrome) else 216
        pen.rounded_rectangle(
            [x0, y0, x1, y1],
            radius=BAR_R * unit * scale,
            fill=colour + (alpha,),
        )

    layer = layer.resize((int(side), int(side)), Image.LANCZOS)
    canvas.alpha_composite(layer, (int(left), int(top)))


def save(img: Image.Image, name: str) -> None:
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"  {name:34} {img.size[0]}x{img.size[1]}")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    print("assets/images")

    # Full-bleed icon (iOS, web, stores).
    icon = gradient(1024)
    draw_glyph(icon, 0.58)
    save(icon, "icon.png")

    # Android adaptive: foreground is masked to a circle, so the mark sits well
    # inside the 66% safe zone.
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_glyph(fg, 0.50)
    save(fg, "android-icon-foreground.png")

    save(gradient(1024), "android-icon-background.png")

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_glyph(mono, 0.50, monochrome=True)
    save(mono, "android-icon-monochrome.png")

    # Splash: glyph only; the screen behind it is painted from app.json.
    splash = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw_glyph(splash, 0.78, monochrome=True)
    save(splash, "splash-icon.png")

    fav = gradient(64)
    draw_glyph(fav, 0.60)
    save(fav, "favicon.png")


if __name__ == "__main__":
    main()
