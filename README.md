# Remotixy

Remotixy is a remote support platform for technicians to manage customer devices, generate host support links, and run consent-based browser remote assistance sessions.

## What it does

- Lets a host explicitly start browser screen sharing with `getDisplayMedia`.
- Generates a short session code and invite URL.
- Lets a helper enter a session code.
- Shows a visible sharing state and an immediate end-session button.
- Supports visible pointer requests as suggestions only.

## Safety boundaries

This app is intentionally designed for legitimate support sessions only. It does not include hidden access, persistence, unattended control, credential capture, OS-level automation, evasion, or bypasses of browser/OS permissions.

## Run locally

Frontend:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

The backend API runs at `http://localhost:8000/api/`.

## Backend features

- Django REST Framework API.
- PostgreSQL-ready database configuration.
- JWT technician authentication.
- Technician accounts only.
- Organization-scoped devices, reports, audit logs, billing plans, install tokens, and Google AI settings.
- Host computers register through technician-generated install tokens without creating accounts.

## Deploy to Render

Use Render's web-service flow at `https://dashboard.render.com/web/new?onboarding=active`.

Frontend service settings:

- **Service type:** Web Service
- **Runtime:** Node
- **Name:** `remotixy`
- **Root directory:** leave blank if this repository only contains this app, or set it to `remote-assist` if the repo root is `C:\Users\Administrator\Remotixy`
- **Build command:** `npm install && npm run build`
- **Start command:** `npm run start -- -p $PORT`
- **Environment variables:**
  - `NODE_ENV=production`
  - `GOOGLE_AI_API_KEY=your_google_ai_key` if you want Gemini assistant support

Backend service settings:

- **Service type:** Web Service
- **Runtime:** Python
- **Name:** `remotixy-api`
- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
- **Start command:** `gunicorn remotixy_backend.wsgi:application`
- **Environment variables:**
  - `DJANGO_SECRET_KEY=your_secure_secret`
  - `DJANGO_DEBUG=false`
  - `DJANGO_ALLOWED_HOSTS=your-api-domain.onrender.com`
  - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com`
  - `CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.onrender.com`
  - `DATABASE_URL=your_render_postgres_internal_url`
  - `FRONTEND_URL=https://your-frontend-domain.onrender.com`
  - `GOOGLE_AI_API_KEY=your_google_ai_key`

This project also includes `render.yaml`, so Render can use a Blueprint deployment if the repository is connected.

## Production roadmap

To make this a real multi-device service, add:

- WebRTC signaling via WebSocket or a managed realtime service.
- TURN/STUN configuration for NAT traversal.
- Rate limiting and abuse prevention.
- Clear consent screens and session recording policies where legally required.

