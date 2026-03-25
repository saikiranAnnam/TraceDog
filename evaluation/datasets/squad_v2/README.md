# SQuAD v2

Loaded at runtime via Hugging Face `datasets` (`squad_v2`). No files are vendored here.

- Paper / task: [SQuAD 2.0](https://rajpurkar.github.io/SQuAD-explorer/)
- HF: `load_dataset("squad_v2", split="validation")`

For this eval harness, each row’s **context** is treated as a single **retrieved document** (gold RAG context), and the **question** is the user prompt.
