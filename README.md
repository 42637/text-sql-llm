# TextSQL-GPT — Natural Language to SQL AI Web Application

A full-stack, responsive AI application powered strictly by the original trained **TextSQL-GPT-v1** neural model (34,423,808 parameters).

---

## 🏛️ Model Specifications

- **Model Name:** TextSQL-GPT-v1
- **Architecture:** 8-layer Decoder-only Causal Transformer
- **Parameters:** 34,423,808 parameters (Strictly loaded from `phase16E_step_38007.pt`)
- **Attention:** 8 Multi-Head Attention heads (`head_dim = 64`, scaled dot-product attention)
- **Hidden Dimensions:** `d_model = 512`, `d_ff = 2048`
- **Context Length:** 2048 tokens
- **Vocabulary:** 16,000 Byte-Level BPE tokens
- **Special Tokens:**
  - `<|unk|>` = 0
  - `<|pad|>` = 1
  - `<|question|>` = 2
  - `<|schema|>` = 3
  - `<|sql|>` = 4
  - `<|endoftext|>` = 5
- **Input Format:** `<|question|>{question}<|schema|>{schema}<|sql|>`

---

## 🚀 Key Features

1. **Original Model Execution:**
   - 100% strictly reconstructed architecture matching `textsql_gpt_config_v1.json` and `phase16E_step_38007.pt`.
   - Never substitutes weights or calls external APIs. Loaded strictly once on backend startup.
2. **SQL Syntax Validation:**
   - Real-time syntax verification powered by `SQLGlot`.
   - Automatic statement formatting and table AST extraction.
3. **Safe In-Memory SQLite Sandbox:**
   - Optional, secure read-only execution preview.
   - Automatically executes schema DDL in `:memory:` SQLite and returns real query results.
4. **ChatGPT-Inspired UI/UX:**
   - Clean white (`#FFFFFF`) and light-grey (`#F7F7F8`) palette, dark charcoal text (`#202123`).
   - Monospace SQL editors with syntax highlighting and line numbers.
   - Optional dark mode toggle.
   - Copy SQL, download as `.sql`, regenerate query, and starred queries.
5. **Full Responsiveness Tested:**
   - Verified across mobile (360px, 390px, 430px), tablet (768px, 1024px), laptop (1366px), and desktop (1920px).
   - Zero horizontal page overflow.

---

## 📦 Directory Structure

```
text-sql/
├── backend/
│   ├── app.py               # FastAPI application with CORS & SPA serving
│   ├── model.py             # Exact 34.4M TextSQL-GPT-v1 Transformer
│   ├── model_loader.py      # Strict checkpoint loader and singleton manager
│   ├── inference.py         # Autoregressive generation engine (<|endoftext|> stopping)
│   ├── sql_validator.py     # SQLGlot syntax validator & SQLite sandbox
│   ├── requirements.txt     # Python backend dependencies
│   └── model/
│       ├── phase16E_step_38007.pt      # Original trained checkpoint (413 MB)
│       ├── textsql_gpt_config_v1.json  # Original configuration
│       └── tokenizer.json              # Original ByteLevelBPE tokenizer (16k vocab)
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular React components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatWorkspace.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── SchemaEditor.tsx
│   │   │   ├── SQLResult.tsx
│   │   │   ├── SQLCodeBlock.tsx
│   │   │   ├── ModelStatus.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── AboutModelModal.tsx
│   │   ├── services/api.ts  # API client
│   │   ├── types.ts         # TypeScript definitions
│   │   ├── App.tsx          # Main application container
│   │   └── index.css        # Tailwind styling
│   ├── dist/                # Production compiled frontend bundle
│   └── package.json
├── run.py                   # One-command server launcher
└── start.bat                # Windows batch launcher
```

---

## ⚡ How to Run

### Quick Start (Single Command)

```bash
python run.py
```
Or double-click `start.bat`.

Then open your browser at:
```
http://127.0.0.1:8000
```

### Development Mode

**Backend:**
```bash
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```
Accessible at `http://localhost:5173`.
