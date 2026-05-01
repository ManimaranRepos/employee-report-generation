import PDFDocument from 'pdfkit';
import type { Employee } from '../types.js';

/**
 * Generates a polished, branded PDF report for an employee.
 * Returns a Promise<Buffer> so it's easy to stream OR attach to email.
 */
export function generateEmployeePdf(employee: Employee): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
        info: {
          Title: `Employee Report — ${employee.FullName}`,
          Author: 'HR Reports',
          Subject: `Profile for ${employee.EmpID}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Brand bar ────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill('#0f172a'); // slate-900
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
        .text('Employee Report', 48, 28);
      doc.font('Helvetica').fontSize(10).fillColor('#cbd5e1')
        .text('Confidential — for internal HR use only', 48, 56);

      // Right-aligned generated date
      const generatedAt = new Date().toLocaleString();
      doc.fontSize(10).fillColor('#cbd5e1')
        .text(`Generated: ${generatedAt}`, 0, 32, { width: doc.page.width - 48, align: 'right' });
      doc.fillColor('#000');

      // ── Hero card ────────────────────────────────────────────────────────
      const heroTop = 110;
      doc.roundedRect(48, heroTop, doc.page.width - 96, 110, 10)
        .fillAndStroke('#f1f5f9', '#e2e8f0'); // slate-100 / slate-200

      // Initials avatar (circle)
      const initials =
        ((employee.FirstName?.[0] ?? '') + (employee.LastName?.[0] ?? '')).toUpperCase() || 'EM';
      const cx = 100;
      const cy = heroTop + 55;
      doc.circle(cx, cy, 32).fill('#6366f1'); // indigo-500
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
        .text(initials, cx - 32, cy - 11, { width: 64, align: 'center' });

      // Name + meta
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(20)
        .text(employee.FullName, 150, heroTop + 22);
      doc.font('Helvetica').fontSize(11).fillColor('#475569')
        .text(`${employee.Designation} · ${employee.Department}`, 150, heroTop + 50);
      doc.fontSize(10).fillColor('#64748b')
        .text(`EmpID: ${employee.EmpID}    |    Status: ${employee.Status}    |    Location: ${employee.Location}`,
          150, heroTop + 70);

      // ── Sections helper ──────────────────────────────────────────────────
      let cursor = heroTop + 140;

      const drawSectionHeader = (title: string) => {
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a')
          .text(title.toUpperCase(), 48, cursor);
        cursor += 18;
        doc.moveTo(48, cursor).lineTo(doc.page.width - 48, cursor)
          .strokeColor('#e2e8f0').lineWidth(1).stroke();
        cursor += 10;
      };

      const drawKeyValueGrid = (rows: Array<[string, string | number]>) => {
        const colW = (doc.page.width - 96) / 2;
        const rowH = 22;
        rows.forEach((kv, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 48 + col * colW;
          const y = cursor + row * rowH;
          doc.font('Helvetica').fontSize(9).fillColor('#64748b')
            .text(kv[0], x, y);
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a')
            .text(String(kv[1] ?? '—'), x, y + 10, { width: colW - 12 });
        });
        const rows2 = Math.ceil(rows.length / 2);
        cursor += rows2 * rowH + 16;
      };

      drawSectionHeader('Contact & Identity');
      drawKeyValueGrid([
        ['Employee ID', employee.EmpID],
        ['Full Name', employee.FullName],
        ['Email', employee.Email],
        ['Phone', employee.Phone],
        ['Date of Birth', employee.DateOfBirth],
        ['Manager', employee.Manager],
      ]);

      drawSectionHeader('Role & Department');
      drawKeyValueGrid([
        ['Department', `${employee.Department} (${employee.DepartmentCode})`],
        ['Designation', employee.Designation],
        ['Location', employee.Location],
        ['Employment Type', employee.EmploymentType],
        ['Date of Joining', employee.DateOfJoining],
        ['Status', employee.Status],
      ]);

      drawSectionHeader('Compensation & Performance');
      drawKeyValueGrid([
        ['Annual Salary', employee.AnnualSalary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })],
        ['Performance Rating', `${employee.PerformanceRating} / 5.0`],
        ['Leave Balance', `${employee.LeaveBalance} days`],
        ['Tenure', tenure(employee.DateOfJoining)],
      ]);

      // ── Footer ───────────────────────────────────────────────────────────
      const footerY = doc.page.height - 56;
      doc.moveTo(48, footerY).lineTo(doc.page.width - 48, footerY)
        .strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
        .text(
          'This document was generated automatically by the Employee Report Generation System. ' +
          'Distribute only via approved HR channels.',
          48, footerY + 8, { width: doc.page.width - 96, align: 'center' },
        );

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}

function tenure(joinDate: string): string {
  const join = new Date(joinDate);
  if (isNaN(join.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m`;
}
