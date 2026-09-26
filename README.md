# Annadata Saathi

Annadata Saathi is an AI-powered precision agriculture platform for farmers, field teams, administrators, and local agricultural offices. The project combines crop intelligence, land registration, crop-health analysis, market access, inventory traceability, equipment support, voice assistance, and sensor monitoring in one web application.

## Project Structure

```text
frontend/   React 19 + Vite application
backend/    FastAPI application and feature routers
assets/     Shared project assets
```

The frontend is the deployable web client. The backend provides the API, AI services, Supabase integrations, and hardware/feature endpoints.

## Main Capabilities

- Farmer and admin dashboards with responsive layouts
- Authentication and face-authentication flows
- Crop health, disease analysis, yield prediction, and crop recommendations
- Land mapping and document upload workflows
- Government schemes and insurance claim assistance
- Mandi prices, marketplace, inventory, and product transparency reports
- Equipment analysis and maintenance recommendations
- Satellite monitoring, sensor data, fire/gas monitoring, and field recommendations
- Voice assistant, AI chat, multilingual UI support, and PWA/offline indicators

## Requirements

- Node.js 18 or newer
- Python 3.10 or newer
- npm
- A Supabase project for the data-backed features

## Local Development

Install all dependencies on Windows:

```bat
setup.bat
```

Or install them separately:

```bash
npm install
npm install --prefix frontend
python -m pip install -r backend/requirements.txt
```

Create `frontend/.env` from `frontend/.env.example` and provide the credentials required by the features you plan to use. Start both applications from the repository root:

```bash
npm run dev
```

This starts Vite on `http://localhost:5173` and FastAPI on `http://localhost:8000`.

To run only the frontend:

```bash
npm run dev --prefix frontend
```

To run only the backend:

```bash
cd backend
uvicorn main:app --reload
```

## Frontend Production Build

The frontend build is Vite-based and outputs `frontend/dist`:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
npm run preview --prefix frontend
```

The production bundle includes the PWA service worker and manifest. The app uses React Router, so the hosting platform must send unknown routes to `index.html`.

## Deploying the Frontend to Vercel

1. Import the repository into Vercel.
2. Set the Vercel **Root Directory** to `frontend`.
3. Use Node.js 18 or newer.
4. The repository already provides `frontend/vercel.json` with the Vite build command, SPA fallback, API proxy, and response security headers.
5. Add the following environment variables in Vercel for the Production environment:

- `VITE_API_BASE_URL`: public URL of the deployed FastAPI backend, without a trailing slash
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPEN_WEATHER_MAP_API` when weather or map data is enabled
- `VITE_VAPI_API_KEY` and `VITE_VAPI_ASSISTANT_ID` when voice calling is enabled
- `VITE_OPENROUTER_API_KEY` when the OpenRouter-backed assistant is enabled

Build command: `npm run build`

Output directory: `dist`

The frontend must be deployed with a backend reachable over HTTPS. Configure the backend `ALLOWED_ORIGINS` variable with the final Vercel domain, for example:

```text
ALLOWED_ORIGINS=https://your-project.vercel.app
```

Never commit real API keys or Supabase secrets. Vite exposes variables prefixed with `VITE_` to the browser, so only public/client-safe values belong there.

## Backend Deployment

The backend entry point is `backend/main.py` and exposes the FastAPI application as `app`. A typical production process is:

```bash
cd backend
gunicorn -k uvicorn.workers.UvicornWorker main:app
```

Set the backend provider's start command to the equivalent of the command above, install `backend/requirements.txt`, and configure the required provider credentials and service URLs. The backend has a health/root endpoint at `/` and feature APIs under `/api/...`.

## Useful Files

- `frontend/.env.example`: frontend environment variable template
- `frontend/vercel.json`: Vercel deployment and SPA routing configuration
- `frontend/vite.config.js`: Vite and PWA build configuration
- `backend/main.py`: FastAPI application entry point
- `backend/requirements.txt`: backend dependencies
- `frontend/ALL_ROUTES.txt`: frontend route inventory

## License

This project is maintained as an academic and hackathon submission. Add the final project license before public distribution.
