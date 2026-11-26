"""
Optional Model Downloader for Cloud Deployments (Render / Docker).
If the checkpoint is hosted externally (e.g., Hugging Face, S3, or Release asset),
this script automatically downloads it at container or server startup if missing.
"""
import os
import sys
import logging
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("textsql_gpt.downloader")

MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "model"))
CHECKPOINT_PATH = os.path.join(MODEL_DIR, "phase16E_step_38007.pt")
DOWNLOAD_URL = os.getenv("MODEL_DOWNLOAD_URL", "")

def ensure_model_exists():
    os.makedirs(MODEL_DIR, exist_ok=True)
    if os.path.exists(CHECKPOINT_PATH) and os.path.getsize(CHECKPOINT_PATH) > 10_000_000:
        logger.info(f"Checkpoint verified locally at: {CHECKPOINT_PATH} ({os.path.getsize(CHECKPOINT_PATH):,} bytes)")
        return True

    if not DOWNLOAD_URL:
        logger.warning(
            f"Checkpoint not found at {CHECKPOINT_PATH} and MODEL_DOWNLOAD_URL is not set. "
            "Please ensure phase16E_step_38007.pt is placed in backend/model/ or committed via Git LFS."
        )
        return False

    logger.info(f"Downloading checkpoint from {DOWNLOAD_URL} to {CHECKPOINT_PATH}...")
    try:
        response = requests.get(DOWNLOAD_URL, stream=True, timeout=600)
        response.raise_for_status()
        with open(CHECKPOINT_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
        logger.info(f"Download complete: {os.path.getsize(CHECKPOINT_PATH):,} bytes written.")
        return True
    except Exception as e:
        logger.error(f"Failed to download checkpoint: {e}")
        return False

if __name__ == "__main__":
    success = ensure_model_exists()
    sys.exit(0 if success else 1)
