/**
 * Generates a realistic sample employees.xlsx file (~40,000 records).
 * Run with:  npm run seed
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const TOTAL = 40_000;
const OUT_DIR = path.resolve(process.cwd(), 'data');
const OUT_FILE = path.join(OUT_DIR, 'employees.xlsx');
const INDEX_FILE = path.join(OUT_DIR, 'employees.index.json');

const FIRST_NAMES = [
  'Aarav', 'Aanya', 'Vivaan', 'Diya', 'Aditya', 'Saanvi', 'Arjun', 'Ananya',
  'Krishna', 'Ishaan', 'Kavya', 'Reyansh', 'Anika', 'Vihaan', 'Myra', 'Kabir',
  'Anaya', 'Sai', 'Pari', 'Aarush', 'Riya', 'Atharva', 'Aadhya', 'Arnav',
  'James', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia',
  'Mason', 'Isabella', 'Lucas', 'Mia', 'Logan', 'Charlotte', 'Henry', 'Amelia',
  'Wei', 'Mei', 'Hiroshi', 'Sakura', 'Min-jun', 'Ji-woo', 'Mohammed', 'Fatima',
  'Carlos', 'Lucia', 'Diego', 'Camila', 'Mateo', 'Valentina',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Iyer', 'Reddy', 'Nair', 'Khan', 'Singh',
  'Kumar', 'Rao', 'Das', 'Joshi', 'Mehta', 'Gupta', 'Mishra', 'Pandey',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Tan', 'Lim', 'Wong', 'Chen', 'Liu', 'Yamamoto', 'Sato', 'Takahashi', 'Park',
  'Kim', 'Lee', 'Choi',
];

const DEPARTMENTS = [
  { name: 'Engineering', codes: ['ENG', 'PLATFORM', 'INFRA', 'DATA'] },
  { name: 'Product', codes: ['PRD'] },
  { name: 'Design', codes: ['DSN'] },
  { name: 'Sales', codes: ['SAL'] },
  { name: 'Marketing', codes: ['MKT'] },
  { name: 'Customer Success', codes: ['CS'] },
  { name: 'Finance', codes: ['FIN'] },
  { name: 'Human Resources', codes: ['HR'] },
  { name: 'Legal', codes: ['LEG'] },
  { name: 'Operations', codes: ['OPS'] },
  { name: 'Research', codes: ['RND'] },
];

const DESIGNATIONS = [
  'Associate', 'Senior Associate', 'Specialist', 'Lead', 'Manager',
  'Senior Manager', 'Director', 'Senior Director', 'Vice President',
  'Engineer I', 'Engineer II', 'Senior Engineer', 'Staff Engineer',
  'Principal Engineer', 'Architect',
];

const LOCATIONS = [
  'Bengaluru, IN', 'Hyderabad, IN', 'Chennai, IN', 'Mumbai, IN', 'Pune, IN',
  'New Delhi, IN', 'San Francisco, US', 'New York, US', 'Seattle, US',
  'Austin, US', 'London, UK', 'Berlin, DE', 'Singapore, SG', 'Tokyo, JP',
  'Sydney, AU', 'Toronto, CA', 'Dublin, IE', 'Amsterdam, NL',
];

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contractor', 'Intern'];
const STATUSES = ['Active', 'Active', 'Active', 'Active', 'On Leave']; // mostly Active

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function makePhone(): string {
  return `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function makeEmail(first: string, last: string, empId: string): string {
  const handle = `${first}.${last}.${empId.slice(-4)}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `${handle}@example.com`;
}

function generateRow(index: number) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const dept = pick(DEPARTMENTS);
  const empId = `EMP${String(100000 + index).padStart(6, '0')}`;
  const joinDate = randomDate(2010, 2025);
  const dob = randomDate(1965, 2003);
  const designation = pick(DESIGNATIONS);
  const salary = randomInt(45_000, 285_000);
  return {
    EmpID: empId,
    FirstName: first,
    LastName: last,
    FullName: `${first} ${last}`,
    Email: makeEmail(first, last, empId),
    Phone: makePhone(),
    Department: dept.name,
    DepartmentCode: pick(dept.codes),
    Designation: designation,
    Manager: `EMP${String(100000 + randomInt(0, Math.max(0, index - 1))).padStart(6, '0')}`,
    Location: pick(LOCATIONS),
    EmploymentType: pick(EMPLOYMENT_TYPES),
    Status: pick(STATUSES),
    DateOfBirth: dob,
    DateOfJoining: joinDate,
    AnnualSalary: salary,
    PerformanceRating: (Math.round((Math.random() * 2 + 3) * 10) / 10), // 3.0 - 5.0
    LeaveBalance: randomInt(0, 30),
  };
}

async function main() {
  console.log(`Generating ${TOTAL.toLocaleString()} employee records…`);
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const rows: ReturnType<typeof generateRow>[] = new Array(TOTAL);
  for (let i = 0; i < TOTAL; i++) {
    rows[i] = generateRow(i);
    if ((i + 1) % 5000 === 0) {
      console.log(`  …${(i + 1).toLocaleString()} rows generated`);
    }
  }

  console.log('Writing Excel file…');
  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto-size a few columns for readability when opened
  ws['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 36 },
    { wch: 18 }, { wch: 20 }, { wch: 8 }, { wch: 22 }, { wch: 12 },
    { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 8 }, { wch: 8 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  XLSX.writeFile(wb, OUT_FILE, { compression: true });
  console.log(`✓ Wrote ${OUT_FILE}`);

  // Build a lightweight EmpID -> rowIndex JSON index for super fast cold-start lookups.
  const index: Record<string, number> = {};
  rows.forEach((r, i) => { index[r.EmpID] = i; });
  writeFileSync(INDEX_FILE, JSON.stringify({ count: rows.length, generatedAt: new Date().toISOString(), index }), 'utf8');
  console.log(`✓ Wrote ${INDEX_FILE}`);

  console.log(`\nSample EmpIDs to try: ${rows[0].EmpID}, ${rows[Math.floor(TOTAL / 2)].EmpID}, ${rows[TOTAL - 1].EmpID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
