import 'dotenv/config';
import path from 'node:path';

function bool(v: string | undefined, fallback = false): boolean {
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  dataFile: path.resolve(process.cwd(), process.env.DATA_FILE ?? './data/employees.xlsx'),

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'HR Reports <hr-reports@example.com>',
  },

  mailPreviewOnly: bool(process.env.MAIL_PREVIEW_ONLY, true),
  mailToOverride: process.env.MAIL_TO_OVERRIDE ?? '',
};

export type AppConfig = typeof config;
