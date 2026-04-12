from __future__ import annotations

import argparse
import json
import os
import sys
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LOCAL_SITE = ROOT / "venv" / "Lib" / "site-packages"
if str(LOCAL_SITE) not in sys.path:
    sys.path.insert(0, str(LOCAL_SITE))

import torch
import transformers
from transformers import AutoConfig, AutoModelForCausalLM, AutoTokenizer
from transformers.models.qwen2.modeling_qwen2 import apply_rotary_pos_emb, repeat_kv


if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


WORLD_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = WORLD_DIR / "hidden_states.json"
DEFAULT_REQUESTED_LAYERS = [0, 8, 16, 24, 32]
TOP_ATTENTION_KEYS = 3

PROMPTS = [
    {
        "id": "math-1",
        "category": "math",
        "text": "Solve 3x + 11 = 26 and explain each step briefly.",
    },
    {
        "id": "math-2",
        "category": "math",
        "text": "What is the derivative of x^3 + 2x^2 - 5x?",
    },
    {
        "id": "math-3",
        "category": "math",
        "text": "Give a short intuition for why the Pythagorean theorem works.",
    },
    {
        "id": "language-1",
        "category": "language",
        "text": "Rewrite this in a more formal tone: we should probably start now.",
    },
    {
        "id": "language-2",
        "category": "language",
        "text": "Explain the difference between metaphor and simile in simple language.",
    },
    {
        "id": "language-3",
        "category": "language",
        "text": "Translate 'the meeting was postponed until tomorrow morning' into Turkish.",
    },
    {
        "id": "code-1",
        "category": "code",
        "text": "Write a Python function that checks whether a string is a palindrome.",
    },
    {
        "id": "code-2",
        "category": "code",
        "text": "Explain what this line does in JavaScript: const items = arr.filter(Boolean);",
    },
    {
        "id": "logic-1",
        "category": "logic",
        "text": "If all robots are machines and some machines are artists, what can we conclude?",
    },
    {
        "id": "logic-2",
        "category": "logic",
        "text": "A statement is true only if both A and B are true. If A is false, what follows?",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract Qwen2.5-7B hidden-state snapshots and export them for the world visualizer.",
    )
    parser.add_argument(
        "--model-dir",
        type=str,
        default=None,
        help="Model directory or HF identifier. Defaults to the best local 7B candidate.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output JSON path. Default: proof_of_concept/world/hidden_states.json",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        choices=["auto", "cuda", "cpu"],
        help="Execution device preference.",
    )
    parser.add_argument(
        "--dtype",
        type=str,
        default="auto",
        choices=["auto", "float16", "bfloat16", "float32"],
        help="Preferred inference dtype.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Resolve model path and layer taps without loading model weights.",
    )
    return parser.parse_args()


def discover_model_dir() -> str:
    candidates = [
        ROOT / "models" / "qwen2.5-7b-awq",
        Path.home() / ".cache" / "huggingface" / "hub" / "models--Qwen--Qwen2.5-7B-Instruct-AWQ",
        "Qwen/Qwen2.5-7B-Instruct-AWQ",
    ]
    for candidate in candidates:
        if isinstance(candidate, Path) and candidate.exists():
            return str(candidate)
        if isinstance(candidate, str):
            return candidate
    raise FileNotFoundError("No usable Qwen2.5-7B model candidate found.")


def resolve_dtype(name: str) -> torch.dtype | None:
    if name == "auto":
        return None
    mapping = {
        "float16": torch.float16,
        "bfloat16": torch.bfloat16,
        "float32": torch.float32,
    }
    return mapping[name]


def resolve_device(name: str) -> str:
    if name == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    return name


def resolve_requested_layers(num_hidden_layers: int, requested_layers: list[int]) -> tuple[list[int], list[dict]]:
    max_valid = num_hidden_layers - 1
    resolved: list[int] = []
    notes: list[dict] = []

    for requested in requested_layers:
        clamped = min(max(requested, 0), max_valid)
        if clamped not in resolved:
            resolved.append(clamped)
        if clamped != requested:
            notes.append(
                {
                    "requested": requested,
                    "resolved": clamped,
                    "reason": f"Qwen2.5-7B exposes decoder layers 0-{max_valid}",
                }
            )

    return resolved, notes


@dataclass
class PromptRun:
    prompt_index: int
    prompt_id: str
    category: str
    prompt_text: str
    token_ids: list[int]
    token_texts: list[str]
    sampled_hidden: dict[int, torch.Tensor]
    qk_scores: dict[int, torch.Tensor]


class QKCollector:
    def __init__(self, model, target_layers: list[int]):
        self.model = model
        self.target_layers = target_layers
        self.current_scores: dict[int, torch.Tensor] = {}
        self._hooks = []
        self._register()

    def _register(self) -> None:
        for layer_idx in self.target_layers:
            module = self.model.model.layers[layer_idx].self_attn

            def hook(attn_module, args, kwargs, layer_idx=layer_idx):
                hidden_states = kwargs.get("hidden_states")
                if hidden_states is None and args:
                    hidden_states = args[0]

                position_embeddings = kwargs.get("position_embeddings")
                attention_mask = kwargs.get("attention_mask")

                if hidden_states is None or position_embeddings is None:
                    return None

                with torch.no_grad():
                    input_shape = hidden_states.shape[:-1]
                    query_shape = (*input_shape, attn_module.config.num_attention_heads, attn_module.head_dim)
                    kv_shape = (*input_shape, attn_module.config.num_key_value_heads, attn_module.head_dim)

                    query_states = attn_module.q_proj(hidden_states).view(query_shape).transpose(1, 2)
                    key_states = attn_module.k_proj(hidden_states).view(kv_shape).transpose(1, 2)
                    cos, sin = position_embeddings
                    query_states, key_states = apply_rotary_pos_emb(query_states, key_states, cos, sin)
                    key_states = repeat_kv(key_states, attn_module.num_key_value_groups)

                    scores = torch.matmul(query_states, key_states.transpose(2, 3)) * attn_module.scaling
                    if attention_mask is not None:
                        scores = scores + attention_mask
                    scores = torch.nan_to_num(scores, nan=0.0, posinf=1e4, neginf=-1e4)

                    self.current_scores[layer_idx] = scores[0].detach().float().cpu()
                return None

            self._hooks.append(module.register_forward_pre_hook(hook, with_kwargs=True))

    def reset(self) -> None:
        self.current_scores = {}

    def remove(self) -> None:
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()


def load_tokenizer(model_dir: str):
    return AutoTokenizer.from_pretrained(model_dir, local_files_only=is_local_dir(model_dir), trust_remote_code=False)


def load_model(model_dir: str, device: str, dtype: torch.dtype | None):
    config = AutoConfig.from_pretrained(model_dir, local_files_only=is_local_dir(model_dir), trust_remote_code=False)
    config._attn_implementation = "eager"

    load_kwargs = {
        "config": config,
        "local_files_only": is_local_dir(model_dir),
        "trust_remote_code": False,
        "low_cpu_mem_usage": True,
    }
    if dtype is not None:
        load_kwargs["torch_dtype"] = dtype

    try:
        model = AutoModelForCausalLM.from_pretrained(model_dir, **load_kwargs)
        model.eval()

        if device == "cuda":
            model = model.to("cuda")
        else:
            model = model.to("cpu")

        model.config.use_cache = False
        return model, config
    except ImportError as exc:
        if "gptqmodel" not in str(exc).lower():
            raise

        print("Transformers AWQ loader is unavailable; falling back to local AutoAWQ runtime.")
        if not hasattr(transformers.modeling_utils, "shard_checkpoint"):
            def _shard_checkpoint_compat(*args, **kwargs):
                raise NotImplementedError("shard_checkpoint compatibility shim should not be used during loading")

            transformers.modeling_utils.shard_checkpoint = _shard_checkpoint_compat

        from awq import AutoAWQForCausalLM

        wrapper = AutoAWQForCausalLM.from_quantized(
            model_dir,
            fuse_layers=False,
            use_exllama=False,
            use_exllama_v2=False,
            safetensors=True,
            max_seq_len=2048,
            device_map="balanced" if device == "cuda" else "cpu",
        )
        model = wrapper.model
        model.eval()
        model.config._attn_implementation = "eager"
        model.config.use_cache = False
        return model, model.config


def is_local_dir(value: str) -> bool:
    return Path(value).exists()


def encode_prompt(tokenizer, prompt_text: str, device: str) -> dict[str, torch.Tensor]:
    inputs = tokenizer(prompt_text, return_tensors="pt")
    return {key: value.to(device) for key, value in inputs.items()}


def collect_prompt_runs(
    model,
    tokenizer,
    sampled_layers: list[int],
    prompts: list[dict],
    device: str,
) -> list[PromptRun]:
    collector = QKCollector(model, sampled_layers)
    prompt_runs: list[PromptRun] = []

    try:
        with torch.inference_mode():
            for prompt_index, prompt in enumerate(prompts):
                collector.reset()
                inputs = encode_prompt(tokenizer, prompt["text"], device)
                outputs = model(
                    **inputs,
                    output_hidden_states=True,
                    use_cache=False,
                    return_dict=True,
                )

                input_ids = inputs["input_ids"][0].detach().cpu().tolist()
                token_texts = tokenizer.convert_ids_to_tokens(input_ids)
                sampled_hidden = {
                    layer_idx: torch.nan_to_num(
                        outputs.hidden_states[layer_idx + 1][0].detach().float().cpu(),
                        nan=0.0,
                        posinf=1e4,
                        neginf=-1e4,
                    )
                    for layer_idx in sampled_layers
                }
                qk_scores = {
                    layer_idx: collector.current_scores[layer_idx]
                    for layer_idx in sampled_layers
                    if layer_idx in collector.current_scores
                }

                prompt_runs.append(
                    PromptRun(
                        prompt_index=prompt_index,
                        prompt_id=prompt["id"],
                        category=prompt["category"],
                        prompt_text=prompt["text"],
                        token_ids=input_ids,
                        token_texts=token_texts,
                        sampled_hidden=sampled_hidden,
                        qk_scores=qk_scores,
                    )
                )
    finally:
        collector.remove()

    return prompt_runs


def build_projection(raw_vectors: list[torch.Tensor]) -> tuple[torch.Tensor, torch.Tensor, list[float]]:
    matrix = torch.nan_to_num(
        torch.stack(raw_vectors, dim=0).to(torch.float32),
        nan=0.0,
        posinf=1e4,
        neginf=-1e4,
    )
    centered = matrix - matrix.mean(dim=0, keepdim=True)
    centered = torch.nan_to_num(centered, nan=0.0, posinf=1e4, neginf=-1e4)
    _, singular_values, vh = torch.linalg.svd(centered, full_matrices=False)

    pca_axes = vh[:3]
    svd_axes = vh[: min(6, vh.shape[0])]
    pca_coords = centered @ pca_axes.T

    denom = max(centered.shape[0] - 1, 1)
    variances = (singular_values ** 2) / denom
    variance_total = float(variances.sum().item()) if variances.numel() else 1.0
    variance_ratio = [
        float((variances[i] / variance_total).item()) if i < variances.shape[0] else 0.0
        for i in range(3)
    ]
    return pca_coords, svd_axes, variance_ratio


def normalize_pca(coords: torch.Tensor, radius: float = 6.2) -> torch.Tensor:
    max_abs = coords.abs().amax(dim=0)
    scale = torch.where(max_abs > 1e-6, radius / max_abs, torch.ones_like(max_abs))
    return coords * scale


def build_attention_summary(
    qk_scores: torch.Tensor | None,
    query_position: int,
    token_texts: list[str],
) -> dict | None:
    if qk_scores is None:
        return None

    query_scores = qk_scores[:, query_position, :]
    per_key_mean = query_scores.mean(dim=0)
    top_count = min(TOP_ATTENTION_KEYS, per_key_mean.shape[0])
    top_values, top_indices = torch.topk(per_key_mean, k=top_count)

    return {
        "scoreMean": round(float(query_scores.mean().item()), 6),
        "scoreMin": round(float(query_scores.min().item()), 6),
        "scoreMax": round(float(query_scores.max().item()), 6),
        "topKeys": [
            {
                "position": int(index.item()),
                "token": token_texts[int(index.item())],
                "score": round(float(value.item()), 6),
            }
            for value, index in zip(top_values, top_indices)
        ],
    }


def build_export(
    prompt_runs: list[PromptRun],
    sampled_layers: list[int],
    layer_notes: list[dict],
    model_dir: str,
    config,
) -> dict:
    raw_vectors: list[torch.Tensor] = []
    sample_index_map: OrderedDict[tuple[int, int, int], int] = OrderedDict()

    for prompt_run in prompt_runs:
        seq_len = len(prompt_run.token_ids)
        for position in range(seq_len):
            for layer_idx in sampled_layers:
                sample_index_map[(prompt_run.prompt_index, position, layer_idx)] = len(raw_vectors)
                raw_vectors.append(prompt_run.sampled_hidden[layer_idx][position])

    pca_coords, svd_axes, variance_ratio = build_projection(raw_vectors)
    normalized_pca = normalize_pca(pca_coords)

    tokens_export = []
    for prompt_run in prompt_runs:
        seq_len = len(prompt_run.token_ids)
        for position in range(seq_len):
            token_layers = {}
            for layer_idx in sampled_layers:
                sample_index = sample_index_map[(prompt_run.prompt_index, position, layer_idx)]
                hidden_vector = raw_vectors[sample_index]
                svd_values = (hidden_vector.to(torch.float32) @ svd_axes.T).tolist()
                top_components = sorted(
                    (
                        {
                            "name": f"SVD-{component_index + 1}",
                            "value": round(float(value), 6),
                        }
                        for component_index, value in enumerate(svd_values)
                    ),
                    key=lambda item: abs(item["value"]),
                    reverse=True,
                )[:3]

                token_layers[str(layer_idx)] = {
                    "pca": [round(float(value), 6) for value in normalized_pca[sample_index].tolist()],
                    "svd": top_components,
                    "attention": build_attention_summary(
                        prompt_run.qk_scores.get(layer_idx),
                        position,
                        prompt_run.token_texts,
                    ),
                }

            tokens_export.append(
                {
                    "id": f"{prompt_run.prompt_id}-tok-{position}",
                    "prompt_id": prompt_run.prompt_id,
                    "prompt_index": prompt_run.prompt_index,
                    "prompt_text": prompt_run.prompt_text,
                    "category": prompt_run.category,
                    "position": position,
                    "token_id": prompt_run.token_ids[position],
                    "text": prompt_run.token_texts[position],
                    "layers": token_layers,
                }
            )

    prompts_export = []
    for prompt_run in prompt_runs:
        qk_logs = {}
        for layer_idx in sampled_layers:
            scores = prompt_run.qk_scores.get(layer_idx)
            if scores is None:
                continue
            qk_logs[str(layer_idx)] = {
                "shape": list(scores.shape),
                "scores": round_nested(scores.tolist(), digits=5),
            }

        prompts_export.append(
            {
                "id": prompt_run.prompt_id,
                "prompt_index": prompt_run.prompt_index,
                "category": prompt_run.category,
                "text": prompt_run.prompt_text,
                "token_ids": prompt_run.token_ids,
                "token_texts": prompt_run.token_texts,
                "qk_scores": qk_logs,
            }
        )

    return {
        "format": "embedding_visualizer_export_v1",
        "metadata": {
            "model_name": Path(model_dir).name if is_local_dir(model_dir) else model_dir,
            "model_path": model_dir,
            "num_hidden_layers": int(config.num_hidden_layers),
            "decoder_layer_max": int(config.num_hidden_layers - 1),
            "requested_decoder_layers": DEFAULT_REQUESTED_LAYERS,
            "sampled_decoder_layers": sampled_layers,
            "layer_resolution_notes": layer_notes,
            "hidden_size": int(config.hidden_size),
            "prompt_count": len(prompt_runs),
            "token_count": len(tokens_export),
            "variance_ratio": [round(value, 6) for value in variance_ratio],
            "variance_text": " / ".join(f"{value * 100:.1f}%" for value in variance_ratio),
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        },
        "prompts": prompts_export,
        "tokens": tokens_export,
    }


def round_nested(value, digits: int):
    if isinstance(value, list):
        return [round_nested(item, digits) for item in value]
    return round(float(value), digits)


def write_export(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)
    print(f"Export written to {path}")


def main() -> None:
    args = parse_args()
    model_dir = args.model_dir or discover_model_dir()
    device = resolve_device(args.device)
    dtype = resolve_dtype(args.dtype)
    if dtype is None:
        dtype = torch.float16 if device == "cuda" else torch.float32

    config = AutoConfig.from_pretrained(model_dir, local_files_only=is_local_dir(model_dir), trust_remote_code=False)
    sampled_layers, layer_notes = resolve_requested_layers(config.num_hidden_layers, DEFAULT_REQUESTED_LAYERS)

    if args.dry_run:
        dry_run_info = {
            "model_dir": model_dir,
            "device": device,
            "dtype": str(dtype) if dtype is not None else "auto",
            "num_hidden_layers": int(config.num_hidden_layers),
            "requested_decoder_layers": DEFAULT_REQUESTED_LAYERS,
            "sampled_decoder_layers": sampled_layers,
            "layer_resolution_notes": layer_notes,
            "prompt_count": len(PROMPTS),
            "output": str(args.output),
        }
        print(json.dumps(dry_run_info, ensure_ascii=False, indent=2))
        return

    print(f"Loading tokenizer from: {model_dir}")
    tokenizer = load_tokenizer(model_dir)

    print(f"Loading model on {device}...")
    model, config = load_model(model_dir, device=device, dtype=dtype)

    if device == "cuda":
        torch.cuda.empty_cache()

    print(f"Running {len(PROMPTS)} prompts across decoder layers {sampled_layers}...")
    prompt_runs = collect_prompt_runs(
        model=model,
        tokenizer=tokenizer,
        sampled_layers=sampled_layers,
        prompts=PROMPTS,
        device=device,
    )

    export_payload = build_export(
        prompt_runs=prompt_runs,
        sampled_layers=sampled_layers,
        layer_notes=layer_notes,
        model_dir=model_dir,
        config=config,
    )
    write_export(args.output, export_payload)


if __name__ == "__main__":
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    main()
