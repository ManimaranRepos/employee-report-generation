export interface Employee {
  EmpID: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  Email: string;
  Phone: string;
  Department: string;
  DepartmentCode: string;
  Designation: string;
  Manager: string;
  Location: string;
  EmploymentType: string;
  Status: string;
  DateOfBirth: string;
  DateOfJoining: string;
  AnnualSalary: number;
  PerformanceRating: number;
  LeaveBalance: number;
}

const BASE = '/api/employees';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchEmployee(empId: string): Promise<Employee> {
  const res = await fetch(`${BASE}/${encodeURIComponent(empId)}`);
  const { employee } = await asJson<{ employee: Employee }>(res);
  return employee;
}

export async function searchEmployees(q: string, limit = 8): Promise<Employee[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  const { results } = await asJson<{ results: Employee[] }>(res);
  return results;
}

export async function generatePdf(empId: string): Promise<Blob> {
  const res = await fetch(`${BASE}/${encodeURIComponent(empId)}/pdf`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `PDF generation failed (${res.status})`);
  }
  return res.blob();
}

export async function emailReport(empId: string): Promise<{
  ok: boolean; sentTo: string; previewOnly: boolean; messageId: string; response: string;
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(empId)}/email`, { method: 'POST' });
  return asJson(res);
}

export async function fetchHealth(): Promise<{ ok: boolean; count: number; loadedAt: string | null }> {
  const res = await fetch(`${BASE}/health`);
  return asJson(res);
}

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

export async function fetchEmailLog(): Promise<{ count: number; entries: EmailLogEntry[] }> {
  const res = await fetch(`${BASE}/email-log`);
  return asJson(res);
}

export interface PagedResult {
  data: Employee[];
  total: number;
  page: number;
  pages: number;
}

export async function fetchEmployeesPage(page: number, limit = 10, q = ''): Promise<PagedResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q.trim()) params.set('q', q.trim());
  const res = await fetch(`${BASE}?${params}`);
  return asJson<PagedResult>(res);
}
