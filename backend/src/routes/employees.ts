import { Router } from 'express';
import { z } from 'zod';
import { employeeStore } from '../services/employeeStore.js';
import { generateEmployeePdf } from '../services/pdfService.js';
import { sendReportEmail, MAX_ATTEMPTS } from '../services/mailService.js';
import { logEmail, readEmailLog } from '../services/emailLogService.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

const router = Router();

const empIdParam = z.object({
  empId: z.string().min(1).max(32),
});

/** Health / store stats */
router.get('/health', (_req, res) => {
  res.json({ ok: true, ...employeeStore.meta() });
});

/** GET /api/employees/email-log — view sent/failed email history */
router.get('/email-log', (_req, res) => {
  const entries = readEmailLog();
  res.json({ count: entries.length, entries });
});

/** GET /api/employees/search?q=... — autocomplete-style */
router.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 64);
  const limit = Math.min(Number(req.query.limit ?? 10), 25);
  const results = employeeStore.search(q, limit);
  res.json({ count: results.length, results });
});

/** GET /api/employees/:empId — fetch one record */
router.get('/:empId', (req, res) => {
  const parsed = empIdParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid EmpID' });
  const employee = employeeStore.findById(parsed.data.empId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json({ employee });
});

/** POST /api/employees/:empId/pdf — stream a generated PDF report */
router.post('/:empId/pdf', async (req, res) => {
  const parsed = empIdParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid EmpID' });
  const employee = employeeStore.findById(parsed.data.empId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  try {
    const pdf = await generateEmployeePdf(employee);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="EmployeeReport-${employee.EmpID}.pdf"`,
    );
    res.send(pdf);
  } catch (err) {
    logger.error({ err }, 'PDF generation failed');
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

/** POST /api/employees/:empId/email — generate PDF and email it */
router.post('/:empId/email', async (req, res) => {
  const parsed = empIdParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid EmpID' });
  const employee = employeeStore.findById(parsed.data.empId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  if (!employee.Email) return res.status(422).json({ error: 'Employee has no email on file' });

  try {
    const pdf = await generateEmployeePdf(employee);
    const result = await sendReportEmail({
      to: employee.Email,
      employeeName: employee.FullName,
      empId: employee.EmpID,
      pdf,
    });
    logEmail({
      empId: employee.EmpID,
      employeeName: employee.FullName,
      sentTo: result.sentTo,
      originalTo: result.originalTo,
      sentAt: new Date().toISOString(),
      status: 'sent',
      attempts: result.attempts,
      messageId: result.messageId,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    logEmail({
      empId: employee.EmpID,
      employeeName: employee.FullName,
      sentTo: config.mailToOverride || employee.Email,
      originalTo: employee.Email,
      sentAt: new Date().toISOString(),
      status: 'failed',
      attempts: MAX_ATTEMPTS,
      error: (err as Error).message,
    });
    logger.error({ err }, 'Email send failed');
    res.status(500).json({ error: 'Email send failed' });
  }
});

export default router;
