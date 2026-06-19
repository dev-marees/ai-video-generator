# Universal File Converter — Backend

FastAPI backend for **Universal File Converter**. It accepts a Markdown
(`.md`) file and turns it into a narrated MP4 video:

1. **Upload** a Markdown file.
2. **Parse** it into sections using headings (`#`, `##`, `###`).
3. **Generate slide images** for each section (Pillow, 1280×720).
4. **Generate narration audio** per slide (gTTS).
5. **Render** slides + audio into a single MP4 (FFmpeg).
6. **Return** the video URL to the frontend.

This is the **`server/`** package of the `ai-video-generator` project. It is a
local POC — all storage is on the local filesystem, with no databases, queues,
containers, or authentication.

```
ai-video-generator/
├── client/        React + Vite frontend
└── server/        ← you are here (FastAPI backend)
```

## Tech Stack

- Python 3.12+ · FastAPI · Uvicorn · Pydantic v2
- Pillow (slide rendering)
- `markdown` + `beautifulsoup4` (parsing)
- gTTS (text-to-speech narration)
- `ffmpeg-python` (video rendering)

## Prerequisites

- **Python 3.12+**
- **FFmpeg** installed and on your `PATH` (`ffmpeg` and `ffprobe`).
  - Windows: `winget install Gyan.FFmpeg` or download from ffmpeg.org
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- **Internet connection** — gTTS uses Google's online TTS service.

## Project Structure

```
server/
├── app/
│   ├── main.py                # FastAPI app: static mount, CORS, routers
│   ├── config.py              # Paths + slide/audio/video settings
│   ├── routers/
│   │   └── jobs.py            # /upload /slides /generate /status /result
│   ├── services/
│   │   ├── markdown_parser.py # Markdown -> sections
│   │   ├── slide_generator.py # sections -> PNG slides (Pillow)
│   │   ├── audio_generator.py # sections -> MP3 narration (gTTS)
│   │   ├── video_generator.py # slides + audio -> MP4 (ffmpeg)
│   │   ├── job_manager.py     # in-memory + on-disk job state
│   │   └── pipeline.py        # orchestrates the full pipeline
│   ├── schemas/
│   │   └── job.py            # Pydantic request/response models
│   ├── models/
│   │   ├── job.py            # JobRecord, JobStatus enum
│   │   └── section.py        # Section domain model
│   └── utils/
│       ├── logging.py
│       └── files.py
├── storage/
│   ├── uploads/{job_id}/      # original .md + meta.json
│   ├── slides/{job_id}/       # slide_1.png, slide_2.png, ...
│   ├── audio/{job_id}/        # slide_1.mp3, slide_2.mp3, ...
│   └── videos/{job_id}/       # output.mp4
├── sample.md                  # example document to test with
├── requirements.txt
└── README.md
```

## Setup & Run

All commands run from the **`server/`** directory.

```bash
# From the repository root:
cd server

# 1. Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server (http://localhost:8080)
uvicorn app.main:app --reload --port 8080
```

You can also run it directly: `python -m app.main`.

- Interactive API docs: <http://localhost:8080/docs>
- Health check: <http://localhost:8080/health>

The frontend (`client/`) proxies `/api/*` to `http://localhost:8080`, so
running this server on port **8080** makes the two work together out of the box.

## API

| Method | Endpoint             | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| POST   | `/upload`            | Upload a `.md` file → `{ job_id, filename }` |
| GET    | `/slides/{job_id}`   | Parse + generate slides → `{ slides: [...] }`|
| POST   | `/generate/{job_id}` | Start async generation → `{ message, ... }`  |
| GET    | `/status/{job_id}`   | Current status → `{ status }`                |
| GET    | `/result/{job_id}`   | Video URL → `{ video_url }`                  |

Statuses: `uploaded` → `generating_slides` → `generating_audio` →
`rendering_video` → `completed` (or `failed`).

Generated media is served as static files under `/storage`, e.g.
`/storage/slides/{job_id}/slide_1.png` and
`/storage/videos/{job_id}/output.mp4`.

### Quick test with cURL

```bash
# Upload
curl -F "file=@sample.md" http://localhost:8080/upload
# -> {"job_id":"<id>","filename":"sample.md"}

# Slide previews (generates them on first call)
curl http://localhost:8080/slides/<id>

# Start generation
curl -X POST http://localhost:8080/generate/<id>

# Poll status until "completed"
curl http://localhost:8080/status/<id>

# Get the video URL
curl http://localhost:8080/result/<id>
```

## Notes

- **gTTS requires internet.** If you are offline, audio generation fails and
  the job status becomes `failed` with an explanatory message.
- Job state is kept in memory and mirrored to
  `storage/uploads/{job_id}/meta.json`, so it survives restarts for status and
  result lookups.
- Configuration (resolution, fonts, fps, port, CORS origins) lives in
  `app/config.py`.
