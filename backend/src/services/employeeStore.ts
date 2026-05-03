import { existsSync, statSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { Employee } from '../types.js';

/**
 * In-memory employee store with an O(1) EmpID hash index.
 * Reading the Excel once into memory + a Map gives sub-millisecond lookups
 * even with 40K+ rows, satisfying the "minimal response time" requirement
 * without needing a database.
 */
class EmployeeStore {
  private byId = new Map<string, Employee>();
  private all: Employee[] = [];
  private loadedAt: Date | null = null;
  private sourceFile = '';

  load(file = config.dataFile): void {
    if (!existsSync(file)) {
      throw new Error(
        `Data file not found at ${file}. Run "npm run seed" in /backend to generate sample data.`,
      );
    }
    const t0 = Date.now();
    const wb = XLSX.readFile(file, { cellDates: false });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Employee>(sheet, { defval: '' });

    this.byId.clear();
    this.all = rows;
    for (const row of rows) {
      if (row.EmpID) this.byId.set(String(row.EmpID).trim().toUpperCase(), row);
    }
    this.loadedAt = new Date();
    this.sourceFile = file;
    logger.info(
      { count: rows.length, ms: Date.now() - t0, file },
      'Employee data loaded into memory',
    );
  }

  count(): number {
    return this.all.length;
  }

  meta() {
    const stat = this.sourceFile && existsSync(this.sourceFile) ? statSync(this.sourceFile) : null;
    return {
      count: this.count(),
      sourceFile: this.sourceFile,
      sourceSizeBytes: stat?.size ?? 0,
      loadedAt: this.loadedAt,
    };
  }

  findById(empId: string): Employee | undefined {
    if (!empId) return undefined;
    return this.byId.get(empId.trim().toUpperCase());
  }

  /** Light-weight search across name / email / department for autocomplete-style UX. */
  search(query: string, limit = 10): Employee[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Employee[] = [];
    for (const e of this.all) {
      if (
        e.EmpID.toLowerCase().includes(q) ||
        e.FullName?.toLowerCase().includes(q) ||
        e.Email?.toLowerCase().includes(q) ||
        e.Department?.toLowerCase().includes(q)
      ) {
        out.push(e);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  /** Paginated listing with optional filter — returns a slice of all employees. */
  getPage(page: number, limit: number, query?: string): { data: Employee[]; total: number } {
    const q = query?.trim().toLowerCase() ?? '';
    const source = q
      ? this.all.filter(
          (e) =>
            e.EmpID.toLowerCase().includes(q) ||
            (e.FullName?.toLowerCase() ?? '').includes(q) ||
            (e.Email?.toLowerCase() ?? '').includes(q) ||
            (e.Department?.toLowerCase() ?? '').includes(q),
        )
      : this.all;
    const total = source.length;
    const offset = (page - 1) * limit;
    return { data: source.slice(offset, offset + limit), total };
  }
}

export const employeeStore = new EmployeeStore();
