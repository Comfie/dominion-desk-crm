/**
 * Bank statement CSV parser
 *
 * SA banks (FNB, Standard Bank, Absa, Nedbank, Capitec, Investec, TymeBank)
 * all export CSV, but every layout differs: preamble lines before the header,
 * one signed "Amount" column vs separate "Money In"/"Money Out" columns,
 * day-first dates, "R 1 234,56" style amounts, "Cr"/"Dr" suffixes.
 *
 * Strategy:
 * 1. Tokenise the CSV (quotes, `,` `;` or tab delimiters).
 * 2. Find the header row by column-name synonyms.
 * 3. If detection fails, throw StatementParseError with the candidate headers
 *    so the UI can ask the landlord to map the columns once.
 */

export const MAX_STATEMENT_ROWS = 5000;

export type StatementFormat = 'single-amount' | 'credit-debit';

export interface ColumnMapping {
  date: number;
  description: number[];
  amount?: number; // signed amount column
  credit?: number; // money-in column
  debit?: number; // money-out column
  balance?: number;
}

export interface ParsedStatementRow {
  rowNumber: number; // 1-based line in the original file
  date: Date;
  description: string;
  amount: number; // signed: credits positive, debits negative
  balance: number | null;
}

export interface StatementParseResult {
  format: StatementFormat;
  headers: string[];
  mapping: ColumnMapping;
  rows: ParsedStatementRow[];
  skippedRows: number;
}

export class StatementParseError extends Error {
  constructor(
    message: string,
    public readonly headers: string[] = [],
    public readonly sampleRows: string[][] = []
  ) {
    super(message);
    this.name = 'StatementParseError';
  }
}

// ---------------------------------------------------------------------------
// CSV tokenising
// ---------------------------------------------------------------------------

function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 30).join('\n');
  const counts = [',', ';', '\t'].map((d) => ({ d, n: sample.split(d).length - 1 }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

export function tokenizeCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, ''); // strip BOM

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------

/**
 * Parse SA-style amounts: "1234.56", "-1,234.56", "R 1 234,56", "1234.56 Cr",
 * "500.00Dr", "(500.00)". Returns null when the cell is empty or unparseable.
 */
export function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  let value = raw.replace(/\u00A0/g, ' ').trim();
  if (!value) return null;

  let sign = 1;
  if (/dr\.?$/i.test(value)) {
    sign = -1;
    value = value.replace(/\s*dr\.?$/i, '');
  } else if (/cr\.?$/i.test(value)) {
    value = value.replace(/\s*cr\.?$/i, '');
  }
  if (/^\(.*\)$/.test(value)) {
    sign = -sign;
    value = value.slice(1, -1);
  }

  value = value.replace(/^zar/i, '').replace(/^r/i, '').replace(/\s/g, '');
  if (value.startsWith('-')) {
    sign = -sign;
    value = value.slice(1);
  } else if (value.startsWith('+')) {
    value = value.slice(1);
  }

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal separator.
    value =
      lastComma > lastDot ? value.replace(/\./g, '').replace(',', '.') : value.replace(/,/g, '');
  } else if (lastComma > -1) {
    // "1234,56" -> decimal comma; "1,234" -> thousands comma
    value = /,\d{1,2}$/.test(value) ? value.replace(',', '.') : value.replace(/,/g, '');
  }

  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const parsed = Number(value) * sign;
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function toUtcNoon(year: number, month: number, day: number): Date | null {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCMonth() === month - 1 ? date : null; // rejects 31 Feb etc.
}

/**
 * Parse bank dates. SA banks are day-first, so "03/09/2026" is 3 September.
 * Supported: 2026-09-03, 2026/09/03, 20260903, 03/09/2026, 03-09-26,
 * 3 Sep 2026, 03 Sept 26, 03-Sep-2026.
 */
export function parseStatementDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  let m: RegExpMatchArray | null;

  if ((m = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) {
    return toUtcNoon(+m[1], +m[2], +m[3]);
  }
  if ((m = value.match(/^(\d{4})(\d{2})(\d{2})$/))) {
    return toUtcNoon(+m[1], +m[2], +m[3]);
  }
  if ((m = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))) {
    return toUtcNoon(+m[3], +m[2], +m[1]);
  }
  if ((m = value.match(/^(\d{1,2})[\s-]([A-Za-z]{3,4})[a-z]*[\s-](\d{2,4})/))) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? toUtcNoon(+m[3], month, +m[1]) : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Header detection
// ---------------------------------------------------------------------------

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

const SYNONYMS = {
  date: ['date', 'transactiondate', 'postingdate', 'postdate', 'trandate', 'valuedate', 'txndate'],
  description: [
    'description',
    'details',
    'narrative',
    'transactiondescription',
    'transactiondetails',
    'particulars',
    'reference',
    'description1',
    'description2',
    'description3',
    'memo',
  ],
  amount: ['amount', 'transactionamount', 'amountzar', 'amountinzar', 'value'],
  credit: ['moneyin', 'credit', 'credits', 'creditamount', 'deposit', 'deposits', 'in', 'paidin'],
  debit: [
    'moneyout',
    'debit',
    'debits',
    'debitamount',
    'withdrawal',
    'withdrawals',
    'out',
    'paidout',
  ],
  balance: ['balance', 'runningbalance', 'balancezar', 'availablebalance', 'closingbalance'],
};

function findColumn(headers: string[], names: string[]): number | undefined {
  const idx = headers.findIndex((h) => names.includes(normalizeHeader(h)));
  return idx === -1 ? undefined : idx;
}

export function detectMapping(headers: string[]): ColumnMapping | null {
  const date = findColumn(headers, SYNONYMS.date);
  const amount = findColumn(headers, SYNONYMS.amount);
  const credit = findColumn(headers, SYNONYMS.credit);
  const debit = findColumn(headers, SYNONYMS.debit);
  const balance = findColumn(headers, SYNONYMS.balance);
  const description = headers
    .map((h, i) => (SYNONYMS.description.includes(normalizeHeader(h)) ? i : -1))
    .filter((i) => i !== -1);

  if (date === undefined || description.length === 0) return null;
  if (amount === undefined && credit === undefined) return null;

  return { date, description, amount, credit, debit, balance };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function parseBankStatement(text: string, mapping?: ColumnMapping): StatementParseResult {
  const table = tokenizeCsv(text).filter((row) => row.some((cell) => cell !== ''));
  if (table.length === 0) {
    throw new StatementParseError('The file is empty.');
  }

  let headerIndex = -1;
  let resolved: ColumnMapping | null = mapping ?? null;

  if (!resolved) {
    for (let i = 0; i < Math.min(table.length, 40); i++) {
      const candidate = detectMapping(table[i]);
      if (candidate) {
        headerIndex = i;
        resolved = candidate;
        break;
      }
    }
  } else {
    // With a manual mapping, scan every row: rows whose date cell doesn't
    // parse (preamble, header, footer) are skipped below.
    headerIndex = -1;
  }

  if (!resolved) {
    const widest = table.slice(0, 40).reduce<string[]>((a, b) => (b.length > a.length ? b : a), []);
    throw new StatementParseError(
      "We couldn't recognise this statement's columns. Please tell us which column is which.",
      widest,
      table.slice(0, 5)
    );
  }

  const headers = headerIndex >= 0 ? table[headerIndex] : table[0];
  const format: StatementFormat = resolved.amount !== undefined ? 'single-amount' : 'credit-debit';

  const rows: ParsedStatementRow[] = [];
  let skippedRows = 0;

  for (let i = headerIndex + 1; i < table.length; i++) {
    const cells = table[i];
    const date = parseStatementDate(cells[resolved.date]);
    if (!date) {
      skippedRows++;
      continue;
    }

    let amount: number | null;
    if (resolved.amount !== undefined) {
      amount = parseAmount(cells[resolved.amount]);
    } else {
      const credit = parseAmount(cells[resolved.credit!]);
      const debit = resolved.debit !== undefined ? parseAmount(cells[resolved.debit]) : null;
      amount = credit && credit !== 0 ? Math.abs(credit) : debit ? -Math.abs(debit) : null;
    }

    if (amount === null) {
      skippedRows++;
      continue;
    }

    const description = resolved.description
      .map((idx) => cells[idx] ?? '')
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    rows.push({
      rowNumber: i + 1,
      date,
      description: description || '(no description)',
      amount,
      balance: resolved.balance !== undefined ? parseAmount(cells[resolved.balance]) : null,
    });

    if (rows.length > MAX_STATEMENT_ROWS) {
      throw new StatementParseError(
        `Statements are limited to ${MAX_STATEMENT_ROWS} rows. Please export a shorter date range.`
      );
    }
  }

  if (rows.length === 0) {
    throw new StatementParseError(
      'No transactions were found in this file. Check that it is a transaction history export.',
      headers,
      table.slice(0, 5)
    );
  }

  return { format, headers, mapping: resolved, rows, skippedRows };
}
