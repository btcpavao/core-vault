"""Create deterministic ER-04 comparison boards without resizing source renders."""

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
        REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png",
        REVIEW_DIR / "er-04-materials-hero.png",
        REVIEW_DIR / "er-04-reference-comparison.png",
    )
    combine(
        REVIEW_DIR / "er-03-reactor-hero.png",
        REVIEW_DIR / "er-04-materials-hero.png",
        REVIEW_DIR / "er-03-vs-er-04.png",
    )


if __name__ == "__main__":
    main()
