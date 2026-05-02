import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE = path.resolve(process.cwd(), './data/email-log.jsonl');

export interface EmailLogEntry {
  empId: string;
  employeeName: string;
  sentTo: string;
  originalTo: string;
  sentAt: string;
  status: 'sent' | 'failed';
  attempts: number;
  messageId?: string;
  error?: string;
}

export function logEmail(entry: EmailLogEntry): void {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    // Non-fatal — don't let a log failure break the response
    console.error('Failed to write email log:', err);
  }
}

export function readEmailLog(): EmailLogEntry[] {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    return content
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as EmailLogEntry)
      .reverse(); // newest first
  } catch {
    return [];
  }
}
