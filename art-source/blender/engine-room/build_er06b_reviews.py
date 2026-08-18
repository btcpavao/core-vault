"""Create deterministic ER-06b comparison plates without resizing sources."""

from pathlib import Path
import subprocess


SOURCE_DIR = Path(__file__).resolve().parent
REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"


def combine(left_path, right_path, output_path):
    subprocess.run(
        [
            "/opt/homebrew/bin/ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", str(left_path),
            "-i", str(right_path),
            "-filter_complex", "[0:v][1:v]hstack=inputs=2[out]",
            "-map", "[out]",
            "-frames:v", "1",
            str(output_path),
        ],
        check=True,
    )


def main():
    combine(
        REVIEW_DIR / "er-06-detail-hero.png",
        REVIEW_DIR / "er-06b-detail-hero.png",
        REVIEW_DIR / "er-06-vs-er-06b.png",
    )
    combine(
        REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png",
        REVIEW_DIR / "er-06b-detail-hero.png",
        REVIEW_DIR / "er-06b-reference-comparison.png",
    )


if __name__ == "__main__":
    main()
