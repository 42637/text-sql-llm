"""
TextSQL-GPT-v1 Neural Architecture.
Exact decoder-only Transformer matching the trained checkpoint phase16E_step_38007.pt.
Total parameters: 34,423,808.
"""
from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F


class Embedding(nn.Module):
    """
    Combined token and learned absolute positional embeddings.
    Weights:
      token_embedding.weight: [vocab_size, d_model] = [16000, 512]
      position_embedding.weight: [context_length, d_model] = [2048, 512]
    """
    def __init__(self, vocab_size: int = 16000, context_length: int = 2048, d_model: int = 512):
        super().__init__()
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(context_length, d_model)

    def forward(self, input_ids: torch.Tensor, start_pos: int = 0) -> torch.Tensor:
        seq_len = input_ids.size(1)
        positions = torch.arange(start_pos, start_pos + seq_len, device=input_ids.device).unsqueeze(0)
        return self.token_embedding(input_ids) + self.position_embedding(positions)


class MultiHeadAttention(nn.Module):
    """
    Causal Multi-Head Self-Attention with scaled dot-product attention.
    Weights:
      qkv.weight: [3 * d_model, d_model] = [1536, 512] (bias=False)
      out_proj.weight: [d_model, d_model] = [512, 512] (bias=False)
    """
    def __init__(self, d_model: int = 512, n_heads: int = 8):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        assert self.head_dim * n_heads == d_model, "d_model must be divisible by n_heads"
        
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.out_proj = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x: torch.Tensor, is_causal: bool = True) -> torch.Tensor:
        B, S, D = x.shape
        qkv = self.qkv(x)  # [B, S, 3 * D]
        qkv = qkv.reshape(B, S, 3, self.n_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]  # each is [B, n_heads, S, head_dim]
        
        # PyTorch 2.x optimized causal scaled dot product attention
        attn_out = F.scaled_dot_product_attention(q, k, v, is_causal=is_causal)
        attn_out = attn_out.permute(0, 2, 1, 3).reshape(B, S, D)
        return self.out_proj(attn_out)


class FeedForward(nn.Module):
    """
    Position-wise Feed-Forward Network.
    Weights:
      fc1.weight: [d_ff, d_model] = [2048, 512] (bias=False)
      fc2.weight: [d_model, d_ff] = [512, 2048] (bias=False)
    Activation: GELU
    """
    def __init__(self, d_model: int = 512, d_ff: int = 2048):
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_ff, bias=False)
        self.fc2 = nn.Linear(d_ff, d_model, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.fc2(F.gelu(self.fc1(x)))


class TransformerBlock(nn.Module):
    """
    Single Decoder Block with Pre-LayerNorm architecture:
      x = x + Attention(LN1(x))
      x = x + FeedForward(LN2(x))
    Weights:
      ln1: LayerNorm(512) (weight & bias)
      attention: MultiHeadAttention
      ln2: LayerNorm(512) (weight & bias)
      feed_forward: FeedForward
    """
    def __init__(self, d_model: int = 512, n_heads: int = 8, d_ff: int = 2048):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attention = MultiHeadAttention(d_model, n_heads)
        self.ln2 = nn.LayerNorm(d_model)
        self.feed_forward = FeedForward(d_model, d_ff)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attention(self.ln1(x))
        x = x + self.feed_forward(self.ln2(x))
        return x


class TextSQLGPT(nn.Module):
    """
    TextSQL-GPT-v1 Architecture.
    Exact parameter count: 34,423,808.
    Decoder-only Transformer with tied token embeddings for language modeling head.
    """
    def __init__(
        self,
        vocab_size: int = 16000,
        context_length: int = 2048,
        d_model: int = 512,
        n_layers: int = 8,
        n_heads: int = 8,
        d_ff: int = 2048,
    ):
        super().__init__()
        self.vocab_size = vocab_size
        self.context_length = context_length
        self.d_model = d_model
        self.n_layers = n_layers
        self.n_heads = n_heads
        self.d_ff = d_ff

        self.embedding = Embedding(vocab_size, context_length, d_model)
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, n_heads, d_ff)
            for _ in range(n_layers)
        ])
        self.final_norm = nn.LayerNorm(d_model)

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        """
        Forward pass producing next-token logits over vocabulary.
        Uses tied word embeddings: logits = final_norm(x) @ token_embedding.weight.T
        """
        x = self.embedding(input_ids)
        for block in self.blocks:
            x = block(x)
        x = self.final_norm(x)
        # Tied weights linear projection
        logits = F.linear(x, self.embedding.token_embedding.weight)
        return logits

    def count_parameters(self) -> int:
        """Returns the total number of unique trainable parameters."""
        # Because weights are tied, count parameters in named_parameters without duplicates
        return sum(p.numel() for p in self.parameters())
