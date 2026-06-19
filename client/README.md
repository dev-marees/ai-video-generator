# Universal File Converter — Web Client

The frontend for **Universal File Converter**: a modern SaaS-style dashboard
that turns a Markdown document into a narrated video. Upload a `.md` file,
preview the rendered markdown, review the generated slide previews, track
processing in real time, and watch / download the finished video — all from a
single screen.

This is the **`client/`** package of the `ai-video-generator` project. The Go
backend lives in the repository root and serves the API this client consumes.

```
ai-video-generator/
├── client/        ← you are here (React + Vite frontend)
└── ...            ← Go backend (API server)
```

## Tech Stack

- **React 19** + **TypeScript** (strict, no `any` types)
- **Vite 6** build tooling
- **TailwindCSS 3** + **shadcn/ui** components
- **TanStack React Query** for server state, polling & caching
- **Axios** for HTTP, via a shared instance
- **react-markdown** + **remark-gfm** for markdown rendering
- **react-dropzone** for drag & drop uploads

## Project Structure

```
client/
├── src/
│   ├── api/          Axios instance + error normalizer, services, query keys
│   │   ├── client.ts
│   │   ├── converter.ts
│   │   └── queryKeys.ts
│   ├── components/    Reusable UI + feature components
│   │   ├── ui/        shadcn/ui primitives (button, card, badge, progress, …)
│   │   ├── FileUpload.tsx
│   │   ├── MarkdownPreview.tsx
│   │   ├── SlidePreviewPanel.tsx
│   │   ├── StatusTracker.tsx
│   │   ├── GenerateVideoPanel.tsx
│   │   └── VideoResult.tsx
│   ├── hooks/         React Query hooks (useUpload, useStatus, useSlides, …)
│   ├── lib/           Shared helpers (cn, queryClient, status metadata)
│   ├── pages/         DashboardPage (wires everything together)
│   └── types/         TypeScript interfaces for the API
├── .env.example      Environment template
├── vite.config.ts    Dev server + API proxy config
└── package.json
```

## API Contract

The client talks to these backend endpoints:

| Method | Endpoint             | Purpose                              |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/upload`            | Upload a `.md` file → `{ job_id }`   |
| GET    | `/slides/{job_id}`   | Slide previews                       |
| POST   | `/generate/{job_id}` | Start video generation               |
| GET    | `/status/{job_id}`   | Current job status (polled every 5s) |
| GET    | `/result/{job_id}`   | Rendered video URL + download URL    |

Job statuses: `uploaded`, `generating_slides`, `generating_audio`,
`rendering_video`, `completed`, `failed`.

## Configuration

The API base URL is read from `VITE_API_BASE_URL` (see `.env`):

```
VITE_API_BASE_URL=/api
```

By default it is `/api`, which the Vite dev server **proxies** to the
backend at `http://localhost:7273` (configured in `vite.config.ts`). To call a
backend directly instead, set e.g. `VITE_API_BASE_URL=http://localhost:7273`
and enable CORS on the backend.

## Running Locally

All commands run from the **`client/`** directory.

```bash
# From the repository root:
cd client

# 1. Install dependencies
npm install

# 2. Create your env file (defaults are fine for local dev)
cp .env.example .env

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

Make sure the backend is running on `http://localhost:7273` (or update the
proxy target in `vite.config.ts` / `VITE_API_BASE_URL`).

## Available Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the Vite dev server on port 5173         |
| `npm run build`     | Type-check (`tsc -b`) + production build → `dist/` |
| `npm run preview`   | Serve the production build locally             |
| `npm run typecheck` | Type-check only, no emit                       |
| `npm run lint`      | Run ESLint over the project                    |
