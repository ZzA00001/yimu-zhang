from PIL import Image, ImageDraw
import os

out = r'C:\Users\zhoucm1\yimu-zhang\app\res\drawable'
os.makedirs(out, exist_ok=True)
S = 512
GREEN = (29, 106, 78, 255)
DEEP = (18, 62, 45, 255)
CREAM = (247, 246, 242, 255)
AMBER = (233, 180, 76, 255)

img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
for y in range(S):
    t = y / (S - 1)
    r = int(31 + 6 * t); g = int(122 + (90 - 122) * t); b = int(90 + (66 - 90) * t)
    d.line([(0, y), (S, y)], fill=(r, g, b, 255))
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([10, 10, S - 10, S - 10], radius=118, fill=255)
img.putalpha(mask)
d = ImageDraw.Draw(img)

# soft light top-left
glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for i in range(230, 0, -2):
    a = int(16 * (1 - i / 230) ** 1.5)
    gd.ellipse([90 - i, 60 - i, 90 + i, 60 + i], fill=(255, 255, 255, a))
img = Image.alpha_composite(img, glow)
d = ImageDraw.Draw(img)

# ledger sheet
d.rounded_rectangle([132, 128, 392, 396], radius=30, fill=(255, 255, 255, 246))
# top accent
d.rounded_rectangle([132, 128, 392, 190], radius=30, fill=(233, 180, 76, 255))
d.rectangle([132, 168, 392, 190], fill=(233, 180, 76, 255))
# rows
for i, y in enumerate((234, 284, 334)):
    d.rounded_rectangle([166, y, 200, y + 16], radius=8, fill=(226, 232, 226, 255))
    d.rounded_rectangle([214, y, 214 + (118 if i != 1 else 84), y + 16], radius=8,
                        fill=(196, 208, 199, 255) if i != 2 else (214, 222, 215, 255))
# check mark
d.ellipse([286, 300, 372, 386], fill=GREEN)
d.line([(307, 343), (328, 364), (353, 325)], fill=CREAM, width=15, joint='curve')
# coins
d.ellipse([352, 106, 428, 182], fill=(255, 255, 255, 120))
img.save(os.path.join(out, 'ic_launcher_foreground.png'))

bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
bd = ImageDraw.Draw(bg)
bd.rounded_rectangle([0, 0, S, S], radius=0, fill=DEEP)
bg.save(os.path.join(out, 'ic_launcher_background.png'))

legacy = Image.new('RGBA', (S, S), (18, 62, 45, 255))
legacy.paste(img, (0, 0), img)
legacy.save(os.path.join(out, 'ic_launcher.png'))

sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for name, size in sizes.items():
    folder = os.path.join(r'C:\Users\zhoucm1\yimu-zhang\app\res', 'mipmap-' + name)
    os.makedirs(folder, exist_ok=True)
    small = legacy.resize((size, size), Image.LANCZOS)
    small.save(os.path.join(folder, 'ic_launcher.png'))
    round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    m = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 4, size * 4], fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    round_img.paste(small, (0, 0), m)
    round_img.save(os.path.join(folder, 'ic_launcher_round.png'))

print('ICONS OK', os.path.getsize(os.path.join(out, 'ic_launcher_foreground.png')))