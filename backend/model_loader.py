"""
Model loader for TextSQL-GPT-v1.
Loads original configuration, tokenizer, and checkpoint weights with strict validation.
Supports environment variables MODEL_PATH and MODEL_DIR for cloud deployments (e.g. Render).
"""
import os
import json
import logging
from typing import Dict, Any, Optional
import torch
from tokenizers import Tokenizer

from model import TextSQLGPT

logger = logging.getLogger("textsql_gpt.loader")

EXPECTED_PARAMS = 34_423_808
SPECIAL_TOKENS = {
    "<|unk|>": 0,
    "<|pad|>": 1,
    "<|question|>": 2,
    "<|schema|>": 3,
    "<|sql|>": 4,
    "<|endoftext|>": 5,
}

class ModelManager:
    """
    Singleton manager holding the loaded TextSQL-GPT-v1 model, tokenizer, and config.
    Ensures model is loaded strictly once at application startup.
    """
    _instance: Optional["ModelManager"] = None

    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            # Check environment variables first
            model_dir = os.getenv("MODEL_DIR")
            if not model_dir:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                model_dir = os.path.join(base_dir, "model")
        
        self.model_dir = model_dir
        self.config_path = os.getenv("CONFIG_PATH") or os.path.join(model_dir, "textsql_gpt_config_v1.json")
        self.tokenizer_path = os.getenv("TOKENIZER_PATH") or os.path.join(model_dir, "tokenizer.json")
        self.checkpoint_path = os.getenv("MODEL_PATH") or os.path.join(model_dir, "phase16E_step_38007.pt")

        self.model: Optional[TextSQLGPT] = None
        self.tokenizer: Optional[Tokenizer] = None
        self.config: Dict[str, Any] = {}
        self.device: torch.device = torch.device("cpu")
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.parameter_count: int = 0
        self.global_step: Optional[int] = None
        self.phase: Optional[str] = None

    @classmethod
    def get_instance(cls, model_dir: Optional[str] = None) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager(model_dir)
        return cls._instance

    def load(self) -> bool:
        """
        Loads config, tokenizer, and weights strictly.
        Returns True on success, raises RuntimeError or returns False with load_error set.
        """
        logger.info(f"Loading TextSQL-GPT-v1 from {self.model_dir}...")
        try:
            # 1. Device selection
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
                logger.info(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
            else:
                self.device = torch.device("cpu")
                logger.info("CUDA not available. Using CPU inference.")

            # 2. Verify files exist
            for path, desc in [
                (self.config_path, "Configuration file"),
                (self.tokenizer_path, "Tokenizer file"),
                (self.checkpoint_path, "Model checkpoint"),
            ]:
                if not os.path.exists(path):
                    raise FileNotFoundError(f"{desc} not found at: {path}")

            # 3. Load config
            logger.info(f"Reading configuration from {self.config_path}...")
            with open(self.config_path, "r", encoding="utf-8") as f:
                self.config = json.load(f)

            # 4. Load tokenizer
            logger.info(f"Loading tokenizer from {self.tokenizer_path}...")
            self.tokenizer = Tokenizer.from_file(self.tokenizer_path)

            # Verify special tokens match expectations
            for token, expected_id in SPECIAL_TOKENS.items():
                tok_id = self.tokenizer.token_to_id(token)
                if tok_id != expected_id:
                    raise ValueError(
                        f"Special token '{token}' ID mismatch: expected {expected_id}, found {tok_id}"
                    )
            logger.info("Tokenizer verified with all 6 special tokens.")

            # 5. Instantiate TextSQLGPT architecture
            d_model = self.config.get("d_model", 512)
            n_layers = self.config.get("n_layers", 8)
            n_heads = self.config.get("n_heads", 8)
            d_ff = self.config.get("d_ff", 2048)
            vocab_size = self.config.get("vocab_size", 16000)
            context_length = self.config.get("context_length", 2048)

            model = TextSQLGPT(
                vocab_size=vocab_size,
                context_length=context_length,
                d_model=d_model,
                n_layers=n_layers,
                n_heads=n_heads,
                d_ff=d_ff,
            )

            param_count = model.count_parameters()
            if param_count != EXPECTED_PARAMS:
                raise ValueError(
                    f"Model parameter count mismatch: expected {EXPECTED_PARAMS}, computed {param_count}"
                )
            self.parameter_count = param_count
            logger.info(f"Instantiated TextSQLGPT architecture with {param_count:,} parameters.")

            # 6. Load checkpoint weights with strict=True
            logger.info(f"Loading checkpoint weights from {self.checkpoint_path}...")
            checkpoint = torch.load(self.checkpoint_path, map_location="cpu", weights_only=False)
            
            if "model_state_dict" not in checkpoint:
                raise KeyError("Checkpoint missing 'model_state_dict' key.")

            state_dict = checkpoint["model_state_dict"]
            self.global_step = checkpoint.get("global_step")
            self.phase = checkpoint.get("phase")

            load_msg = model.load_state_dict(state_dict, strict=True)
            logger.info(f"Loaded checkpoint with strict=True. Status: {load_msg}")

            # 7. Move model to device and set eval mode
            model.to(self.device)
            model.eval()
            self.model = model
            self.is_loaded = True
            self.load_error = None
            logger.info(
                f"TextSQL-GPT-v1 successfully loaded and ready for inference on {self.device}."
            )
            return True

        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load TextSQL-GPT-v1: {e}", exc_info=True)
            return False

    def get_status(self) -> Dict[str, Any]:
        """Returns the current runtime status of the model."""
        return {
            "status": "ok" if self.is_loaded else "error",
            "backend_status": "ok",
            "model_ready": self.is_loaded,
            "model_loaded": self.is_loaded,
            "model_name": self.config.get("model_name", "TextSQL-GPT-v1"),
            "architecture": self.config.get("architecture", "decoder_only_transformer"),
            "device": str(self.device),
            "parameter_count": self.parameter_count,
            "vocab_size": self.config.get("vocab_size", 16000),
            "context_length": self.config.get("context_length", 2048),
            "global_step": self.global_step,
            "phase": self.phase,
            "error": self.load_error,
        }
