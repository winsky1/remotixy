# Remotixy

A standalone Next.js prototype for consent-based browser remote assistance.

## What it does

- Lets a host explicitly start browser screen sharing with `getDisplayMedia`.
- Generates a short session code and invite URL.
- Lets a helper enter a session code.
- Shows a visible sharing state and an immediate end-session button.
- Supports visible pointer requests as suggestions only.

## Safety boundaries

This app is intentionally designed for legitimate support sessions only. It does not include hidden access, persistence, unattended control, credential capture, OS-level automation, evasion, or bypasses of browser/OS permissions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Render

Use Render's web-service flow at `https://dashboard.render.com/web/new?onboarding=active`.

Recommended settings:

- **Service type:** Web Service
- **Runtime:** Node
- **Name:** `remotixy`
- **Root directory:** leave blank if this repository only contains this app, or set it to `remote-assist` if the repo root is `C:\Users\Administrator\Remotixy`
- **Build command:** `npm install && npm run build`
- **Start command:** `npm run start -- -p $PORT`
- **Environment variables:**
  - `NODE_ENV=production`
  - `GOOGLE_AI_API_KEY=your_google_ai_key` if you want Gemini assistant support

This project also includes `render.yaml`, so Render can use a Blueprint deployment if the repository is connected.

## Production roadmap

To make this a real multi-device service, add:

- Authenticated users and support roles.
- Short-lived invite tokens stored server-side.
- WebRTC signaling via WebSocket or a managed realtime service.
- TURN/STUN configuration for NAT traversal.
- Audit logs for session lifecycle events.
- Rate limiting and abuse prevention.
- Clear consent screens and session recording policies where legally required.

