"""Draws the app icons (lime dumbbell on near-black). Run: python3 scripts/make-icons.py"""
from PIL import Image, ImageDraw

BG, FG = (9, 9, 11), (163, 230, 53)

def icon(size, scale=1.0, rounded=True):
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)
    c = s / 2
    u = s * 0.05 * scale
    def bar(x0, x1, h):
        d.rounded_rectangle([c + x0 * u, c - h * u, c + x1 * u, c + h * u], radius=u * 0.8, fill=FG)
    bar(-5, 5, 0.7)
    bar(-6.6, -4.4, 4.2); bar(4.4, 6.6, 4.2)
    bar(-8.6, -7.0, 2.6); bar(7.0, 8.6, 2.6)
    return img.resize((size, size), Image.LANCZOS)

icon(192).save("public/icon-192.png")
icon(512).save("public/icon-512.png")
icon(512, scale=0.72, rounded=False).save("public/icon-maskable-512.png")
icon(180, rounded=False).save("public/apple-touch-icon.png")
