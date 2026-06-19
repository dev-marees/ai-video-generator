# Universal File Converter — Frontend

A modern SaaS-style dashboard that converts a Markdown document into a
narrated video. Upload a `.md` file, preview the rendered markdown, review the
generated slide previews, and render a narrated video — all from one screen.

> This repository contains the **frontend only**. It expects a backend that
> implements the API contract below.

## Tech Stack

- **React 19** + **TypeScript** (no `any` types)
- **Vite 6** build tooling
- **TailwindCSS 3** + **shadcn/ui** components
- **TanStack React Query** for server state, polling & caching
- **Axios** for HTTP, via a shared instance
- **react-markdown** + **remark-gfm** for markdown rendering
- **react-dropzone** for drag & drop uploads

## Project Structure

```
src/
  api/          Axios instance, services, query keys
    client.ts
    converter.ts
    queryKeys.ts
  components/    Reusable UI + feature components
    ui/         shadcn/ui primitives (button, card, badge, …)
    FileUpload.tsx
    MarkdownPreview.tsx
    SlidePreviewPanel.tsx
    StatusTracker.tsx
    GenerateVideoPanel.tsx
    VideoResult.tsx
    ...
  hooks/         React Query hooks (useUpload, useStatus, useSlides, …)
  lib/           Shared helpers (cn, queryClient, status metadata)
  pages/         DashboardPage (wires everything together)
  types/         TypeScript interfaces for the API
```

## API Contract

The frontend talks to these backend endpoints:

| Method | Endpoint               | Purpose                              |
| ------ | ---------------------- | ------------------------------------ |
| POST   | `/upload`              | Upload a `.md` file → `{ job_id }`   |
| GET    | `/slides/{job_id}`     | Slide previews                       |
| POST   | `/generate/{job_id}`   | Start video generation               |
| GET    | `/status/{job_id}`     | Current job status (polled every 5s) |
| GET    | `/result/{job_id}`     | Rendered video URL + download URL    |

Job statuses: `uploaded`, `generating_slides`, `generating_audio`,
`rendering_video`, `completed`, `failed`.

## Configuration

The API base URL is read from `VITE_API_BASE_URL` (see `.env`):

```
VITE_API_BASE_URL=/api
```

By default it is `/api`, which the Vite dev server **proxies** to
`http://localhost:8080` (configured in `vite.config.ts`). To point directly at
a backend instead, set e.g. `VITE_API_BASE_URL=http://localhost:8080` and
update CORS on the backend.

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create your env file (defaults are fine for local dev)
cp .env.example .env

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

Other scripts:

```bash
npm run build      # Type-check + production build to dist/
npm run preview    # Preview the production build
npm run typecheck  # Type-check only
```

> Make sure your backend is running on `http://localhost:8080` (or update the
> proxy target in `vite.config.ts` / `VITE_API_BASE_URL`).
