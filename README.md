# Inventory & Order Management System

Full-stack inventory and order management application with a **React** frontend, **FastAPI** backend, **PostgreSQL** database, and **Docker Compose** orchestration.

## Features

- **Products** — CRUD with unique SKU, non-negative stock, price validation
- **Customers** — Create, list, view, delete with unique email
- **Orders** — Create with automatic stock deduction and backend-calculated totals; cancel restores stock
- **Dashboard** — Totals and low-stock alerts (threshold ≤ 10)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| Containers | Docker, Docker Compose |

## Quick Start (Docker)

1. Copy environment template:

```bash
cp .env.example .env
```

2. Edit `.env` and set a strong `POSTGRES_PASSWORD`.

3. Build and run:

```bash
docker compose up --build -d
```

4. Open the app:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

## API Endpoints

### Products
- `POST /products` — Create
- `GET /products` — List all
- `GET /products/{id}` — Get one
- `PUT /products/{id}` — Update
- `DELETE /products/{id}` — Delete

### Customers
- `POST /customers` — Create
- `GET /customers` — List all
- `GET /customers/{id}` — Get one
- `DELETE /customers/{id}` — Delete

### Orders
- `POST /orders` — Create (reduces stock, calculates total)
- `GET /orders` — List all
- `GET /orders/{id}` — Get one
- `DELETE /orders/{id}` — Cancel (restores stock)

### Dashboard
- `GET /dashboard/summary` — Stats and low-stock products

## Business Rules

- Product SKU must be unique
- Customer email must be unique
- Stock cannot go negative (DB constraint + API checks)
- Orders rejected when stock is insufficient
- Order total computed server-side from product prices × quantities
- Deleting an order restores inventory

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=postgresql://inventory:inventory@localhost:5432/inventory_db
set CORS_ORIGINS=http://localhost:5173
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
set VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend dev server: http://localhost:5173

## Docker Hub (Backend Image)

Build and push your backend image (replace `YOUR_DOCKERHUB_USER`):

```bash
docker build -t YOUR_DOCKERHUB_USER/inventory-api:latest .
docker login
docker push YOUR_DOCKERHUB_USER/inventory-api:latest
```

**Docker Hub image link (fill after push):**  
`https://hub.docker.com/r/YOUR_DOCKERHUB_USER/inventory-api`

## Deployment

### Backend — Render (recommended)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **PostgreSQL** database (free tier).
3. Create a **Web Service** → **Docker** with **either** setup:

   **Option A (recommended on Render):**
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile`

   **Option B (repo root):**
   - **Root Directory:** *(empty)*
   - **Dockerfile Path:** `Dockerfile` *(the one at repo root)*
   - **Docker Build Context:** `.`
4. Set environment variables:
   - `DATABASE_URL` — Internal connection string from Render Postgres
   - `CORS_ORIGINS` — Your Vercel/Netlify frontend URL (e.g. `https://your-app.vercel.app`)
5. Deploy and note the public URL (e.g. `https://inventory-api.onrender.com`).

Alternatively use `render.yaml` Blueprint in the repo root.

### Backend — Railway / Fly.io

- **Railway:** New project → PostgreSQL plugin → deploy backend Dockerfile; set `DATABASE_URL` and `CORS_ORIGINS`.
- **Fly.io:** `fly launch` in `backend/`, attach Postgres, set secrets for `DATABASE_URL` and `CORS_ORIGINS`.

### Frontend — Vercel

1. Import the GitHub repo on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_URL` = your deployed backend URL (no trailing slash)
4. Deploy.

`vercel.json` is included for SPA routing.

### Frontend — Netlify

1. Import repo, base directory `frontend`, build command `npm run build`, publish `dist`.
2. Set `VITE_API_URL` in Netlify environment variables.
3. `_redirects` in `public/` handles client-side routing.

### Post-deployment checklist

- [ ] Backend `/health` returns `{"status":"healthy"}`
- [ ] Backend `/docs` loads
- [ ] Frontend loads and dashboard shows data
- [ ] CORS: `CORS_ORIGINS` includes exact frontend origin (scheme + host, no path)
- [ ] Create product → customer → order end-to-end

## Submission Deliverables

Fill in after you deploy:

| Item | Your link |
|------|-----------|
| GitHub repository | `https://github.com/YOUR_USER/inventory-mgmt` |
| Docker Hub (backend) | `https://hub.docker.com/r/YOUR_USER/inventory-api` |
| Live frontend | `https://YOUR_APP.vercel.app` |
| Live backend API | `https://YOUR_API.onrender.com` |

## Project Structure

```
inventory-mgmt/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── routers/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT
