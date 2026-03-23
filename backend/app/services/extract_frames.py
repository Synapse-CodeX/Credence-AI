import os
import subprocess
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "frames"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def get_video_duration(path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            path
        ],
        capture_output=True,
        text=True
    )
    return float(result.stdout.strip())


def extract_frames(video_path: str, output_prefix: str):
    duration = get_video_duration(video_path)
    fps = 5 / duration

    output_pattern = os.path.join(OUTPUT_DIR, f"{output_prefix}_%03d.jpg")

    subprocess.run([
        "ffmpeg",
        "-i", video_path,
        "-vf", f"fps={fps}",
        output_pattern
    ], check=True)

    return [
        os.path.join(OUTPUT_DIR, f)
        for f in os.listdir(OUTPUT_DIR)
        if f.startswith(output_prefix)
    ]


@app.post("/extract-frames")
async def extract(file: UploadFile = File(...)):
    video_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(video_path, "wb") as f:
        f.write(await file.read())

    prefix = os.path.splitext(file.filename)[0]

    try:
        frames = extract_frames(video_path, prefix)
        return JSONResponse({"frames": frames})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    video_path = "test2.webm"   # change to your file
    prefix = "output"

    try:
        frames = extract_frames(video_path, prefix)
        print("Extracted frames:")
        for f in frames:
            print(f)
    except Exception as e:
        print("Error:", e)