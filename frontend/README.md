# LabStash Frontend

Next.js frontend for the LabStash temporary file-sharing service.

## Tech Stack

- **Next.js 16.3** (React 19) with App Router
- **TypeScript**
- **Tailwind CSS v4** (PostCSS plugin)
- **Bun** as package manager
- **qrcode.react** for QR code generation
- **Vercel Analytics + Speed Insights**

## Getting Started

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Run the dev server
bun dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_HOST_URL` | Public URL for QR code links (e.g. `http://localhost:3000`) |

`.env.local` is used for local development and points to `localhost:8000`. The `.env` file points to the production backend on Render.

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Home page (hero, uploader, FAQ)
│   ├── layout.tsx               # Root layout, metadata, Vercel analytics
│   ├── globals.css              # Full design system (custom properties + component styles)
│   ├── download/
│   │   └── page.tsx             # Manual code-entry download page
│   └── d/
│       ├── [file_id]/page.tsx   # Direct download page (via QR/shared link)
│       └── not-found/page.tsx   # File not found page
├── components/
│   ├── Navbar.tsx               # Sticky nav with mobile menu
│   ├── Footer.tsx               # 4-column footer
│   ├── FaqItem.tsx              # Expandable FAQ accordion
│   ├── FaqMoreButton.tsx        # "Show more" FAQ toggle
│   ├── DeleteConfirmDialog.tsx  # Native <dialog> confirmation modal
│   ├── upload/
│   │   ├── FileUploader.tsx     # Drag-drop upload, progress bar, post-upload UI
│   │   └── QRGenerator.tsx      # QR code SVG renderer
│   └── download/
│       ├── FileDownloader.tsx       # Short-code input, file list, download/delete
│       ├── DirectDownloadClient.tsx # Auto-fetch manifest, state machine UI
│       └── DirectDownloadButton.tsx # Download trigger button with error handling
├── lib/
│   └── api/
│       ├── upload.ts            # XHR upload with progress callback
│       └── download.ts          # Fetch-based manifest/download/delete with cache
└── types/
    └── file.ts                  # TypeScript interfaces (UploadResponse, StoredFile, etc.)
```

## Frontend Routes

| Path | Description |
|------|-------------|
| `/` | Home page with inline upload widget |
| `/download` | Manual code-entry page to retrieve files |
| `/d/{file_id}` | Direct download page (linked from QR codes) |
| `/d/not-found` | Shown when a file ID is invalid |

## Key Architecture Decisions

- **Upload progress**: Uses raw `XMLHttpRequest` (not `fetch`) to get `upload.onprogress` events.
- **Manifest cache**: Client-side LRU cache (100 entries, 5-min TTL) with request deduplication prevents redundant API calls when navigating.
- **State machines**: `DirectDownloadClient` and `FileDownloader` use explicit status states (`loading`, `ready`, `expired`, `not-found`, `error`, `deleted`) instead of scattered booleans.
- **Race condition guards**: `operationRef` pattern ensures stale async operations don't overwrite newer state.
- **Design system**: Custom CSS using CSS custom properties (not Tailwind utility classes). See `DESIGN.md` in the repo root for the full design spec.

## Linting

```bash
bun lint
```

Uses ESLint 9 with `eslint-config-next` (core-web-vitals + TypeScript).
