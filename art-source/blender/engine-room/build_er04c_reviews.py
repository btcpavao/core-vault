"""Create the deterministic ER-04b versus ER-04c normal comparison."""

from pathlib import Path
import subprocess


SOURCE_DIR = Path(__file__).resolve().parent
REVIEW_DIR = SOURCE_DIR / "review"


def main():
    subprocess.run(
        [
            "/opt/homebrew/bin/ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", str(REVIEW_DIR / "er-04b-architecture-material-closeup.png"),
            "-i", str(REVIEW_DIR / "er-04c-architecture-normal-closeup.png"),
            "-filter_complex", "[0:v][1:v]hstack=inputs=2[out]",
            "-map", "[out]",
            "-frames:v", "1",
            str(REVIEW_DIR / "er-04b-vs-er-04c.png"),
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
