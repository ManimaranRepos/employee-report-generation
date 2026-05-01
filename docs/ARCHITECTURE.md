# Architecture

## Sequence — happy path

```
User ──▶ React UI ──▶ /api/employees/:empId ──▶ employeeStore.findById (O(1) map lookup)
                                              ◀── Employee JSON
User clicks "Generate PDF"
React UI ──▶ /api/employees/:empId/pdf ──▶ pdfService.generateEmployeePdf
                                          (PDFKit → Buffer)
                                  ◀── application/pdf (streamed)
User clicks "Send Email"
React UI ──▶ /api/employees/:empId/email ──▶ pdfService.generateEmployeePdf
                                          ──▶ mailService.sendReportEmail (Nodemailer)
                                  ◀── { ok, sentTo, previewOnly, messageId }
```

## Why an in-memory hash index over a database

For 40K rows (~10–20 MB Excel) loaded once at boot:

- Cold start: ~1–2 s parse
- Steady state: O(1), <1 ms lookups, ~30 MB RAM
- No I/O on the hot path → deterministic latency, perfect for the "minimal response time" NFR

When this stops being a good fit:

- Records are mutating (HR system) → you need a database / event-driven cache invalidation
- Multi-instance horizontal scale → put the data in Redis / DynamoDB / RDS, keep the same `employeeStore` interface
- You need full-text or fuzzy search → ship the data into OpenSearch / Algolia / a SQLite FTS5 file

## File-by-file responsibilities

```
backend/src/services/employeeStore.ts   — loads xlsx, exposes findById + search
backend/src/services/pdfService.ts      — pure: Employee → Buffer (PDFKit)
backend/src/services/mailService.ts     — Nodemailer transport, preview-only fallback
backend/src/routes/employees.ts         — thin HTTP layer (zod validation, status codes)
backend/src/app.ts                      — middleware composition
backend/src/index.ts                    — boot: load data, start server
```

The React side is purely presentational: every effect is keyed to `employee` / `pdfUrl` and toasts surface errors.

## Adding a real auth layer

The closest production-realistic upgrade:

1. Put the API behind your existing IdP (Cognito / Okta / Auth0)
2. Validate JWTs with `express-jwt` middleware
3. Scope `/api/employees/*` to an HR role
4. Audit log every PDF generation + email send (employee identifiers + actor)

## Trade-offs taken

- **Excel-as-source-of-truth** is convenient but brittle; for any environment past "demo", migrate to RDS/DynamoDB.
- **PDFKit** beats Puppeteer for cold-start cost and dependency size; tradeoff is HTML-grade layouts are harder.
- **Nodemailer JSON transport** preview is a deliberate UX choice so the demo runs end-to-end with no SMTP creds.
