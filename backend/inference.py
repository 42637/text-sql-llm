"""
Inference engine for TextSQL-GPT-v1.
Formats prompt as: <|question|>{question}<|schema|>{schema}<|sql|>
Performs canonical schema normalization and autoregressive generation stopping at <|endoftext|>.
"""
import re
import time
import logging
from typing import Dict, Any, Optional
import torch

from model_loader import ModelManager, SPECIAL_TOKENS
from sql_validator import SQLValidator

logger = logging.getLogger("textsql_gpt.inference")

END_OF_TEXT_ID = SPECIAL_TOKENS["<|endoftext|>"]
MAX_CONTEXT_LENGTH = 2048


def normalize_schema(schema: str) -> str:
    """
    Normalizes database schema to canonical form expected by the trained model.
    - Strips SQL comments (-- line comments and /* block comments */)
    - Normalizes irregular whitespace, CRLF, and multiline indentation to single spaces
    - Preserves exact table and column names and types
    """
    # Strip line comments
    clean = re.sub(r"--.*$", "", schema, flags=re.MULTILINE)
    # Strip block comments
    clean = re.sub(r"/\*.*?\*/", "", clean, flags=re.DOTALL)
    # Collapse multiple whitespaces and newlines
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


class InferenceEngine:
    """
    Handles prompt creation, tokenization, autoregressive generation,
    and post-processing for TextSQL-GPT-v1.
    """

    def __init__(self, model_manager: Optional[ModelManager] = None):
        if model_manager is None:
            model_manager = ModelManager.get_instance()
        self.manager = model_manager

    def format_prompt(self, question: str, schema: str) -> str:
        """
        Formats input strictly according to training format:
        <|question|>{question}<|schema|>{schema}<|sql|>
        """
        clean_q = question.strip()
        clean_s = normalize_schema(schema)
        return f"<|question|>{clean_q}<|schema|>{clean_s}<|sql|>"

    def generate_sql(
        self,
        question: str,
        schema: str,
        max_new_tokens: int = 256,
        temperature: float = 0.0,
        top_k: int = 20,
        top_p: float = 0.90,
    ) -> Dict[str, Any]:
        """
        Generates a SQL query from natural language question and database schema.
        Uses greedy decoding (temperature=0.0) for deterministic, maximum-accuracy generation.
        """
        if not self.manager.is_loaded or self.manager.model is None or self.manager.tokenizer is None:
            return {
                "generated_sql": "",
                "formatted_sql": "",
                "sql_valid": False,
                "validation_error": None,
                "generation_time_seconds": 0.0,
                "prompt_tokens": 0,
                "generated_tokens": 0,
                "status": "error",
                "error": f"Model is not loaded: {self.manager.load_error or 'Backend initialization failed'}",
            }

        clean_q = question.strip()
        if not clean_q:
            return {
                "generated_sql": "",
                "formatted_sql": "",
                "sql_valid": False,
                "validation_error": None,
                "generation_time_seconds": 0.0,
                "prompt_tokens": 0,
                "generated_tokens": 0,
                "status": "error",
                "error": "Question cannot be empty.",
            }

        prompt_str = self.format_prompt(clean_q, schema)
        tokenizer = self.manager.tokenizer
        model = self.manager.model
        device = self.manager.device

        # Tokenize prompt
        encoded = tokenizer.encode(prompt_str)
        prompt_ids = encoded.ids
        prompt_len = len(prompt_ids)

        if prompt_len >= MAX_CONTEXT_LENGTH - 10:
            return {
                "generated_sql": "",
                "formatted_sql": "",
                "sql_valid": False,
                "validation_error": None,
                "generation_time_seconds": 0.0,
                "prompt_tokens": prompt_len,
                "generated_tokens": 0,
                "status": "error",
                "error": f"Prompt length ({prompt_len} tokens) exceeds maximum context capacity ({MAX_CONTEXT_LENGTH} tokens). Please shorten schema.",
            }

        start_time = time.perf_counter()

        # Inference autoregressive generation
        input_tensor = torch.tensor([prompt_ids], dtype=torch.long, device=device)
        curr_tensor = input_tensor
        generated_token_ids = []

        try:
            with torch.no_grad():
                for step in range(max_new_tokens):
                    if curr_tensor.size(1) >= MAX_CONTEXT_LENGTH:
                        logger.warning("Reached maximum context length during generation.")
                        break

                    logits = model(curr_tensor)
                    next_token_logits = logits[0, -1, :]

                    # For SQL generation, greedy decoding produces the highest accuracy
                    if temperature > 0.0:
                        scaled_logits = next_token_logits / max(temperature, 0.05)
                        if top_k > 0:
                            v, _ = torch.topk(scaled_logits, min(top_k, scaled_logits.size(-1)))
                            scaled_logits[scaled_logits < v[-1]] = -float("Inf")
                        probs = torch.softmax(scaled_logits, dim=-1)
                        next_token = torch.multinomial(probs, num_samples=1)
                        token_id = next_token.item()
                    else:
                        token_id = torch.argmax(next_token_logits, dim=-1).item()

                    # Stop condition: End of Text token
                    if token_id == END_OF_TEXT_ID:
                        break

                    generated_token_ids.append(token_id)
                    next_tensor = torch.tensor([[token_id]], dtype=torch.long, device=device)
                    curr_tensor = torch.cat([curr_tensor, next_tensor], dim=1)

            elapsed_time = time.perf_counter() - start_time

            # Decode generated tokens
            raw_sql = tokenizer.decode(generated_token_ids)
            # Clean SQL output: remove any markdown wrapping, trailing semicolons
            clean_sql = raw_sql.strip()
            clean_sql = re.sub(r"^```(?:sql)?\s*", "", clean_sql)
            clean_sql = re.sub(r"\s*```$", "", clean_sql)
            clean_sql = clean_sql.strip().rstrip(";")

            # Syntax validation using SQLGlot
            validation = SQLValidator.validate_syntax(clean_sql)

            logger.info(
                f"[GENERATION] Q: '{clean_q}' -> SQL: '{clean_sql}' ({len(generated_token_ids)} tokens, {elapsed_time:.3f}s)"
            )

            return {
                "generated_sql": clean_sql,
                "formatted_sql": validation["formatted_sql"] if validation["is_valid"] else clean_sql,
                "sql_valid": validation["is_valid"],
                "validation_error": validation["error"],
                "statement_type": validation.get("statement_type"),
                "generation_time_seconds": round(elapsed_time, 4),
                "prompt_tokens": prompt_len,
                "generated_tokens": len(generated_token_ids),
                "status": "success",
                "error": None,
            }

        except Exception as e:
            logger.error(f"Generation error: {e}", exc_info=True)
            elapsed_time = time.perf_counter() - start_time
            return {
                "generated_sql": "",
                "formatted_sql": "",
                "sql_valid": False,
                "validation_error": None,
                "generation_time_seconds": round(elapsed_time, 4),
                "prompt_tokens": prompt_len,
                "generated_tokens": len(generated_token_ids),
                "status": "error",
                "error": f"Generation failed: {str(e)}",
            }
