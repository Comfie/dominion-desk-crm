import { describe, expect, it } from 'vitest';

import {
  parseAmount,
  parseBankStatement,
  parseStatementDate,
  StatementParseError,
  tokenizeCsv,
} from '../utils/statement-parser';

const iso = (d: Date | null) => d?.toISOString().slice(0, 10);

describe('parseAmount', () => {
  it.each([
    ['1234.56', 1234.56],
    ['-1,234.56', -1234.56],
    ['R 1 234,56', 1234.56],
    ['R8 500.00', 8500],
    ['1234.56 Cr', 1234.56],
    ['500.00Dr', -500],
    ['(500.00)', -500],
    ['1.234,56', 1234.56],
    ['8,500', 8500],
    ['', null],
    ['abc', null],
  ])('parses %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });
});

describe('parseStatementDate', () => {
  it.each([
    ['2026-09-03', '2026-09-03'],
    ['2026/09/03', '2026-09-03'],
    ['20260903', '2026-09-03'],
    ['03/09/2026', '2026-09-03'], // day-first
    ['3 Sep 2026', '2026-09-03'],
    ['03 Sept 26', '2026-09-03'],
    ['03-Sep-2026', '2026-09-03'],
  ])('parses %s', (raw, expected) => {
    expect(iso(parseStatementDate(raw))).toBe(expected);
  });

  it('rejects impossible dates', () => {
    expect(parseStatementDate('31/02/2026')).toBeNull();
    expect(parseStatementDate('Opening balance')).toBeNull();
  });
});

describe('tokenizeCsv', () => {
  it('handles quoted fields with commas and escaped quotes', () => {
    expect(tokenizeCsv('a,"b, c","say ""hi"""\n1,2,3')).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['1', '2', '3'],
    ]);
  });

  it('detects semicolon delimiters', () => {
    expect(tokenizeCsv('Date;Amount\n2026-09-01;100')).toEqual([
      ['Date', 'Amount'],
      ['2026-09-01', '100'],
    ]);
  });
});

describe('parseBankStatement', () => {
  it('parses a single-amount layout with preamble lines (FNB style)', () => {
    const csv = [
      'ACCOUNT TRANSACTION HISTORY',
      'Account,62000000000',
      '',
      'Date,Amount,Balance,Description',
      '2026/09/01,8500.00,18500.00,"FNB APP PAYMENT FROM DD-7K3M9Q MOYO"',
      '2026/09/02,-350.00,18150.00,"POS PURCHASE PICK N PAY"',
    ].join('\n');

    const result = parseBankStatement(csv);

    expect(result.format).toBe('single-amount');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      amount: 8500,
      balance: 18500,
      description: 'FNB APP PAYMENT FROM DD-7K3M9Q MOYO',
    });
    expect(result.rows[1].amount).toBe(-350);
  });

  it('parses a money-in / money-out layout (Capitec style)', () => {
    const csv = [
      'Transaction Date,Description,Money In,Money Out,Balance',
      '01/09/2026,Payment Received: NDLOVU RENT,"7 200,00",,"12 000,00"',
      '02/09/2026,Electricity,,"500,00","11 500,00"',
    ].join('\n');

    const result = parseBankStatement(csv);

    expect(result.format).toBe('credit-debit');
    expect(result.rows.map((r) => r.amount)).toEqual([7200, -500]);
    expect(iso(result.rows[0].date)).toBe('2026-09-01');
  });

  it('joins multiple description columns', () => {
    const csv = 'Date,Description,Reference,Amount\n2026-09-01,DEPOSIT,DD-ABC234,100';
    expect(parseBankStatement(csv).rows[0].description).toBe('DEPOSIT DD-ABC234');
  });

  it('asks for a manual mapping when columns are unrecognised', () => {
    const csv = 'Col1,Col2,Col3\n2026-09-01,Something,100';
    expect(() => parseBankStatement(csv)).toThrow(StatementParseError);
  });

  it('accepts a manual column mapping', () => {
    const csv = 'Col1,Col2,Col3\n2026-09-01,Rent Moyo,100\n2026-09-02,Rent Dube,200';
    const result = parseBankStatement(csv, { date: 0, description: [1], amount: 2 });
    expect(result.rows.map((r) => r.amount)).toEqual([100, 200]);
  });
});
