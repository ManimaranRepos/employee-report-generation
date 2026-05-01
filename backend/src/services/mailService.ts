import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config.js';
import { logger } from '../logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  // In preview-only mode, use Nodemailer's "json" transport so we can show a
  // structured preview in the UI without actually sending.
  if (config.mailPreviewOnly || !config.smtp.host) {
    logger.warn('Mailer running in PREVIEW-ONLY mode (set MAIL_PREVIEW_ONLY=false and configure SMTP_* to send for real).');
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
    tls: { rejectUnauthorized: false },
  });
  return transporter;
}

export interface SendReportArgs {
  to: string;
  employeeName: string;
  empId: string;
  pdf: Buffer;
}

export async function sendReportEmail({ to, employeeName, empId, pdf }: SendReportArgs) {
  const t = getTransporter();

  const resolvedTo = config.mailToOverride || to;
  if (config.mailToOverride && config.mailToOverride !== to) {
    logger.info({ original: to, override: config.mailToOverride }, 'MAIL_TO_OVERRIDE active — redirecting email');
  }

  const subject = `Your Employee Report (${empId})`;
  const text =
    `Hi ${employeeName},\n\n` +
    `Please find your latest employee report attached.\n\n` +
    `If you have any questions, contact HR.\n\n— HR Reports`;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; color: #0f172a;">
      <h2 style="margin: 0 0 8px;">Your Employee Report</h2>
      <p style="color:#475569; margin: 0 0 12px;">Hi <strong>${escape(employeeName)}</strong>,</p>
      <p>Please find your latest employee report attached as a PDF.</p>
      <p style="color:#64748b; font-size: 12px; margin-top: 24px;">
        Sent automatically by the Employee Report Generation System.
      </p>
    </div>`;

  const info = await t.sendMail({
    from: config.smtp.from,
    to: resolvedTo,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `EmployeeReport-${empId}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  });

  return {
    previewOnly: config.mailPreviewOnly || !config.smtp.host,
    messageId: info.messageId,
    response: (info as { message?: string }).message ?? '',
    sentTo: resolvedTo,
    originalTo: to,
  };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ));
}
