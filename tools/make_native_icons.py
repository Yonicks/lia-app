"""Resize Talki icon/splash into Android and iOS native resource slots."""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICON = Image.open(ROOT / "icons" / "icon-512.png").convert("RGBA")
CREAM = (255, 246, 228)
RES = ROOT / "android" / "app" / "src" / "main" / "res"

ANDROID_LAUNCHER = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
ANDROID_FG = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
ANDROID_SPLASH = {
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (1080, 1920),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1920, 1080),
    "drawable-land-xxxhdpi": (1920, 1280),
}

def fit_icon(size, pad=0.18):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = int(size * (1 - 2 * pad))
    mark = ICON.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.paste(mark, ((size - inner) // 2, (size - inner) // 2), mark)
    return canvas

def splash(w, h):
    img = Image.new("RGB", (w, h), CREAM)
    side = int(min(w, h) * 0.36)
    mark = ICON.resize((side, side), Image.Resampling.LANCZOS)
    img.paste(mark, ((w - side) // 2, (h - side) // 2), mark)
    return img

def write_android():
    for folder, size in ANDROID_LAUNCHER.items():
        d = RES / folder
        d.mkdir(parents=True, exist_ok=True)
        ico = fit_icon(size, pad=0.08)
        ico.save(d / "ic_launcher.png")
        ico.save(d / "ic_launcher_round.png")
    for folder, size in ANDROID_FG.items():
        d = RES / folder
        d.mkdir(parents=True, exist_ok=True)
        fit_icon(size, pad=0.22).save(d / "ic_launcher_foreground.png")
    splash(480, 800).save(RES / "drawable" / "splash.png")
    for folder, size in ANDROID_SPLASH.items():
        d = RES / folder
        d.mkdir(parents=True, exist_ok=True)
        splash(*size).save(d / "splash.png")

def write_ios():
    appicon = ROOT / "ios" / "App" / "App" / "Assets.xcassets" / "AppIcon.appiconset"
    splashset = ROOT / "ios" / "App" / "App" / "Assets.xcassets" / "Splash.imageset"
    if not appicon.exists():
        print("iOS project not present yet; skip iOS icons")
        return
    # Universal 1024 marketing icon covers modern Xcode single-size App Icon
    fit_icon(1024, pad=0.08).convert("RGB").save(appicon / "AppIcon-512@2x.png")
    if splashset.exists():
        splash(2732, 2732).save(splashset / "splash-2732x2732.png")
        splash(2732, 2732).save(splashset / "splash-2732x2732-1.png")
        splash(2732, 2732).save(splashset / "splash-2732x2732-2.png")

if __name__ == "__main__":
    write_android()
    write_ios()
    print("native icons/splash written")
