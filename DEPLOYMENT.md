# TextSQL-GPT Production Deployment Guide (Vercel + Render)

This guide provides step-by-step instructions to deploy **TextSQL-GPT** into production with:
- **Frontend:** Vercel (React 19 + TypeScript + Vite)
- **Backend:** Render (Python + FastAPI + PyTorch)
- **Model:** Original `TextSQL-GPT-v1` (34,423,808 parameters)

---

## 🏗️ Architecture Overview

```
 [User Browser / Mobile]
          │
          ▼
   Vercel Edge CDN (Frontend SPA)
          │  REST API (CORS enabled)
          ▼
  Render Web Service (FastAPI Backend)
          │
          ▼
  TextSQL-GPT-v1 (Inference Engine on PyTorch)
  - 34.4M parameters (phase16E_step_38007.pt)
  - In-memory SQLite Sandbox (Safe query validation)
```

---

## 1. GitHub Repository Setup (With Git LFS)

Because `phase16E_step_38007.pt` is 413 MB, GitHub requires **Git LFS** (Large File Storage) for files > 100 MB. Render natively supports Git LFS during deployment builds.

Run in your project root:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Install and configure Git LFS
git lfs install
git lfs track "*.pt"
git add .gitattributes

# 3. Add all files and commit
git add .
git commit -m "feat: complete production ready TextSQL-GPT with Vercel and Render configurations"

# 4. Push to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/textsql-gpt.git
git branch -M main
git push -u origin main
```

*(Note: If you do not want to use Git LFS on GitHub, you can upload `phase16E_step_38007.pt` to Hugging Face or AWS S3 and set `MODEL_DOWNLOAD_URL` in Render environment variables; [download_model.py](file:///f:/text-sql/backend/download_model.py) will automatically download it on startup!)*

---

## 2. Render Backend Deployment

### Option A: Using Blueprint (One-Click)

The repository includes a ready-to-use `render.yaml` blueprint.
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your repository.
4. Render will automatically detect `render.yaml` and configure the service.

### Option B: Manual Web Service Setup

1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `textsql-gpt-backend`
   - **Region:** Choose closest to your users (e.g., Oregon, Frankfurt, Singapore).
   - **Branch:** `main`
   - **Root Directory:** Leave empty (or `backend`)
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install --upgrade pip && pip install -r backend/requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn app:app --app-dir backend --host 0.0.0.0 --port $PORT
     ```
   - **Health Check Path:** `/health`
4. **Instance Plan:**
   - **Starter Plan ($7/mo, 1GB RAM, 0.5 CPU):** *Strongly Recommended.* Model weights (137 MB) + PyTorch runtime require ~650 MB RAM. The Starter plan guarantees zero OOM issues and zero sleeping/cold starts.
   - **Free Plan (512MB RAM):** Works using swap, but may experience cold-start spin-down after 15 minutes of inactivity.
   - **GPU on Render:** Not required! TextSQL-GPT-v1 is a compact 34.4M model; CPU inference takes only 0.4s - 1.1s.
5. **Environment Variables:**
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` | Recommended Python version |
   | `ALLOWED_ORIGINS` | `*` *(or `https://your-app.vercel.app`)* | Allowed CORS frontend origins |
   | `MODEL_DIR` | `backend/model` | Path to model artifacts |
   | `PORT` | `10000` | Port assigned by Render |
   | `MODEL_DOWNLOAD_URL` | *(optional)* | Direct URL if downloading checkpoint outside Git LFS |
6. Click **Create Web Service**. Wait for the build to complete.
7. Copy your backend URL: `https://textsql-gpt-backend.onrender.com`.

---

## 3. Vercel Frontend Deployment

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables:**
   - Add a new variable:
     - **Key:** `VITE_API_BASE_URL`
     - **Value:** `https://textsql-gpt-backend.onrender.com` *(your Render service URL)*
6. Click **Deploy**.
7. Vercel will build and deploy the React application in ~30 seconds with clean SPA routing powered by `vercel.json`.

---

## 4. Post-Deployment Verification Checklist

Once both services are deployed, test your production setup:

1. **Verify Backend Health:**
   Visit: `https://YOUR-BACKEND.onrender.com/health`
   Expected response:
   ```json
   {
     "status": "ok",
     "backend_status": "ok",
     "model_ready": true,
     "model_loaded": true,
     "model_name": "TextSQL-GPT-v1",
     "parameter_count": 34423808,
     "device": "cpu"
   }
   ```

2. **Verify Frontend Application:**
   Open: `https://YOUR-APP.vercel.app`
   - Confirm status pill shows **Online (TextSQL-GPT-v1)**.
   - Enter Question:
     ```
     Show all employees whose salary is greater than 50000.
     ```
   - Enter Schema:
     ```sql
     CREATE TABLE employees (
       employee_id INTEGER PRIMARY KEY,
       employee_name TEXT,
       salary REAL,
       department_id INTEGER
     );
     ```
   - Click **Generate SQL**.
   - Verify generated SQL displays:
     ```sql
     SELECT * FROM employees WHERE salary > 50000;
     ```
   - Click **Run in Safe Sandbox** to verify the in-memory SQLite preview table.
   - Test on mobile phone or tablet to verify responsive zero-overflow layout.
