# Universal File Converter

A local POC that converts a Markdown (`.md`) document into a narrated MP4 video.
Upload a markdown file, preview the rendered document and auto-generated slides,
then render a narrated video — all from a SaaS-style dashboard.

```
ai-video-generator/
├── client/   React + TypeScript + Vite frontend (port 5173)
└── server/   FastAPI backend (port 7273)
```

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, React Query, Axios
- **Backend:** Python 3.12+, FastAPI, Pillow, markdown, BeautifulSoup, gTTS, ffmpeg-python

## Prerequisites

- **Node.js 18+** (for the frontend)
- **Python 3.12+** (for the backend)
- **FFmpeg** on your `PATH` (`ffmpeg` + `ffprobe`)
- **Internet connection** — narration uses gTTS (Google's online TTS)

## Run the demo (two terminals)

### Terminal 1 — Backend (port 8080)

```bash
cd server
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows PowerShell
# source .venv/bin/activate          # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Terminal 2 — Frontend (port 5173)

```bash
cd client
npm install
npm run dev
```

Then open **http://localhost:5173**.

## How they connect

The frontend talks to the backend entirely through the Vite dev proxy
(`client/vite.config.ts`), so everything is same-origin in development — no CORS
setup needed:

| Frontend request   | Proxied to backend            | Purpose                       |
| ------------------ | ----------------------------- | ----------------------------- |
| `/api/*`           | `http://localhost:8080/*`     | API calls (upload, status, …) |
| `/storage/*`       | `http://localhost:8080/storage/*` | Slide images & rendered video |

Because of this, the backend must run on **port 8080**. To use a different host
or port, update the `target` values in `client/vite.config.ts` (or set
`VITE_API_BASE_URL` in `client/.env` and `public_base_url` in
`server/app/config.py`).

## Using the app

1. **Upload** a `.md` file (drag & drop or browse). The markdown preview renders
   immediately and slide previews are generated on the fly.
2. Click **Generate video**. The status tracker polls every 5 seconds through
   `uploaded → generating_slides → generating_audio → rendering_video → completed`.
3. When complete, the **video player** appears with a **Download** button.

There's a `server/sample.md` you can use to try it out.

## Per-package docs

- Frontend: [`client/README.md`](client/README.md)
- Backend: [`server/README.md`](server/README.md)
