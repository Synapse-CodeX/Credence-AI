import os
import subprocess
import logging

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "frames"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_video_duration(path: str) -> float:
    """Extract the duration of a video file using ffprobe."""
    try:
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
            text=True,
            check=True
        )
        return float(result.stdout.strip())
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")
        raise ValueError(f"Could not read video duration: {e}")

def extract_5_frames(video_path: str, output_prefix: str) -> list[str]:
    """Extract exactly 5 frames from a video file using ffmpeg."""
    try:
        duration = get_video_duration(video_path)
        # Calculate fps to get exactly 5 frames across the duration
        fps = 5 / duration

        # Ensure output directory exists for this prefix
        prefix_output_dir = os.path.join(OUTPUT_DIR, output_prefix)
        os.makedirs(prefix_output_dir, exist_ok=True)

        output_pattern = os.path.join(prefix_output_dir, "frame_%03d.jpg")

        subprocess.run([
            "ffmpeg",
            "-i", video_path,
            "-vf", f"fps={fps}",
            "-vframes", "5",  # Explicitly limit to 5 frames
            "-q:v", "2",      # High quality
            output_pattern
        ], check=True, capture_output=True)

        frames = [
            os.path.join(prefix_output_dir, f)
            for f in sorted(os.listdir(prefix_output_dir))
            if f.endswith(".jpg")
        ]
        
        # Return only the first 5 frames found (redundant but safe)
        return frames[:5]
    except Exception as e:
        logger.error(f"Error extracting frames: {e}")
        raise ValueError(f"Frame extraction failed: {e}")
