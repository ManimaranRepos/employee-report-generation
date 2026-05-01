# Employee Report Generation System

A modern, responsive web app to **search an employee by EmpID, generate a polished PDF report, and email it** — all from one screen.

Built on a contemporary stack:

| Layer | Tech |
|---|---|
| Frontend | **React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Lucide Icons** |
| Backend  | **Node.js + Express + TypeScript + Zod**, with Helmet, CORS, compression & rate limiting |
| Data     | **Excel (.xlsx)** with ~40,000 records, loaded into an **in-memory hash index** for sub-millisecond lookups |
| PDF      | **PDFKit** (server-side, branded, A4) |
| Email    | **Nodemailer** (SMTP / AWS SES / Gmail / Mailtrap — configurable) |

---

## Quick Start

```bash
# 1. Install dependencies (root + workspaces)
npm install
npm --workspaces install

# 2. Generate the sample 40K-record Excel file
npm run seed

# 3. Configure environment (optional — defaults to "mail preview" mode)
cp backend/.env.example backend/.env

# 4. Run backend + frontend together
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:4000>

---

## Project layout

```
.
├── package.json                 # workspaces + root scripts
├── backend/
│   ├── scripts/
│   │   └── generateSampleData.ts  # Generates employees.xlsx (40K rows)
│   ├── src/
│   │   ├── index.ts               # Server entry
│   │   ├── app.ts                 # Express app factory
│   │   ├── config.ts              # Env config
│   │   ├── logger.ts              # Pino logger
│   │   ├── types.ts               # Shared types
│   │   ├── routes/employees.ts    # API routes
│   │   └── services/
│   │       ├── employeeStore.ts   # Excel loader + hash-indexed lookup
│   │       ├── pdfService.ts      # Branded PDF via PDFKit
│   │       └── mailService.ts     # SMTP via Nodemailer
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts             # Proxies /api → :4000
    └── src/
        ├── App.tsx                # Composition root
        ├── main.tsx
        ├── styles.css             # Tailwind + custom mesh / glass
        ├── lib/api.ts             # Typed fetch helpers
        └── components/
            ├── SearchBar.tsx      # Live suggestions, keyboard nav
            ├── EmployeeCard.tsx   # Hero card with stats
            ├── ActionBar.tsx      # Generate PDF · Send Email
            ├── PdfPreview.tsx     # Inline PDF viewer
            └── EmptyState.tsx
```

---

## API contract

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/employees/health`              | Service status + record count |
| `GET`  | `/api/employees/search?q=&limit=`    | Lightweight search (name / id / dept / email) |
| `GET`  | `/api/employees/:empId`              | Fetch one employee |
| `POST` | `/api/employees/:empId/pdf`          | Generate the PDF (returned as `application/pdf`) |
| `POST` | `/api/employees/:empId/email`        | Generate PDF + email it to employee |

Sample EmpIDs in the generated dataset: **`EMP100000` … `EMP139999`**.

---

## Configuration

Backend `.env` (copy from `.env.example`):

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATA_FILE=./data/employees.xlsx

# SMTP — leave blank or set MAIL_PREVIEW_ONLY=true to skip actual sending
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="HR Reports <hr-reports@example.com>"
MAIL_PREVIEW_ONLY=true
```

`MAIL_PREVIEW_ONLY=true` is the default — the API still simulates a send so the UI works end-to-end without real credentials. Flip to `false` once SMTP is configured.

---

## Performance notes

- The Excel file is parsed **once at boot** (about 1–2s for 40K rows on a typical laptop) into a `Map<EmpID, Employee>` — every lookup after that is **O(1) and sub-millisecond**.
- `/search` does an early-exit linear scan capped at `limit` matches — keeps complexity low without needing a full-text index. Swap in an inverted index if you need fuzzy ranking.
- For multi-instance deployments, replace the in-memory store with **Redis / DynamoDB / RDS** — the `employeeStore` interface is intentionally small.

## Security

- `helmet` for sensible HTTP defaults
- `cors` restricted to the configured origin
- `express-rate-limit` (240 req/min) on the API surface
- All inputs validated with `zod`
- No secrets in source — SMTP creds via env

## Production architecture (suggested)

```
  ┌────────────┐     HTTPS      ┌───────────────┐
  │  React app │ ─────────────▶ │  API (Node)   │
  │  (CDN/S3)  │                │  Fargate/EKS  │
  └────────────┘                └──────┬────────┘
                                       │
        ┌──────────────────────────────┼─────────────────────────┐
        ▼                              ▼                         ▼
  ┌───────────┐               ┌─────────────────┐         ┌─────────────┐
  │  RDS /    │               │  Lambda: PDFKit │         │   AWS SES   │
  │ DynamoDB  │               │ (cold-cacheable)│         │   (email)   │
  └───────────┘               └─────────────────┘         └─────────────┘
```

The Excel file is fine for demos / small orgs; for real scale, ingest it into RDS/DynamoDB and treat the store as a read-through cache.

## Build for production

```bash
npm run build
npm run start    # runs the compiled backend on $PORT
# Serve frontend/dist behind any CDN (S3+CloudFront, Vercel, Netlify…)
```

---

Made for the **Employee Report Generation** requirement. Have fun.
