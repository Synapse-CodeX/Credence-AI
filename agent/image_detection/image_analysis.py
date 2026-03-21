import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS

# -----------------------------
# METADATA CHECK
# -----------------------------
def metadata_score(image_path):
    try:
        img = Image.open(image_path)
        score = 0.5  #  neutral
        exif = img._getexif()
        # CASE 1: NO EXIF → neutral
        if exif is None:
            return 0.5  
        exif_data = {
            TAGS.get(tag, tag): val
            for tag, val in exif.items()
        }
        # CASE 2: Camera info → strong real signal
        if "Make" in exif_data or "Model" in exif_data:
            score -= 0.3  # push toward real

        # CASE 3: Software info
        software = str(exif_data.get("Software", "")).lower()

        ai_keywords = [
            "stable diffusion",
            "midjourney",
            "dalle",
            "photoshop",
            "gimp",
            "ai",
            "gemini",
            "openai",
            "deepfake"
        ]

        if any(k in software for k in ai_keywords):
            score += 0.3  # push toward AI

        # CASE 4: Resolution consistency
        width, height = img.size
        if width < 256 or height < 256:
            score += 0.1  # slightly suspicious

        # Clamp score between 0 and 1
        score = max(0.0, min(1.0, score))
        return score
    except Exception as e:
        return 0.5  # neutral


# -----------------------------
# FFT ANALYSIS (ADVANCED)
# -----------------------------
def fft_score(image_path):
    img = Image.open(image_path).convert("L")
    arr = np.array(img)

    fft = np.fft.fft2(arr)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log(np.abs(fft_shift) + 1)

    # AI images often overly smooth → lower high freq
    high_freq = np.mean(magnitude[50:-50, 50:-50])
    return 1 - (high_freq / np.max(magnitude))



# NOISE ANALYSIS

def noise_score(image_path):
    img = Image.open(image_path).convert("L")
    arr = np.array(img)

    noise = np.std(arr)

    if noise < 10:
        return 0.7  # too smooth → AI
    elif noise < 25:
        return 0.5
    else:
        return 0.3



# EDGE CONSISTENCY

def edge_score(image_path):
    img = Image.open(image_path).convert("L")
    arr = np.array(img)

    edges = np.abs(np.diff(arr, axis=0)).mean()

    if edges < 5:
        return 0.7
    elif edges < 15:
        return 0.5
    else:
        return 0.3


