import { formatPageTitle, isLocalDate, toLocalDate, today } from './dates';

describe('toLocalDate', () => {
  it('formats the local calendar day with zero padding', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('today', () => {
  it('uses the local calendar day, not the UTC one', () => {
    expect(today(new Date(2026, 8, 27, 0, 30))).toBe('2026-09-27');
    expect(today(new Date(2026, 8, 27, 23, 30))).toBe('2026-09-27');
  });
});

describe('isLocalDate', () => {
  it.each(['2026-09-27', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isLocalDate(value)).toBe(true);
  });

  it.each(['', '2026-9-27', '2026-09-27T00:00', '27-09-2026', '2026-13-01', '2026-02-29', '2026-04-31', 'abcd-ef-gh'])(
    'rejects "%s"',
    (value) => {
      expect(isLocalDate(value)).toBe(false);
    },
  );
});

describe('formatPageTitle (US-03)', () => {
  it.each([
    ['2026-09-27', 'Sunday, 27 Sep 2026'],
    ['2026-01-05', 'Monday, 5 Jan 2026'],
    ['2028-02-29', 'Tuesday, 29 Feb 2028'],
    ['2026-12-31', 'Thursday, 31 Dec 2026'],
    ['2027-01-01', 'Friday, 1 Jan 2027'],
  ])('formats %s as "%s"', (date, title) => {
    expect(formatPageTitle(date)).toBe(title);
  });

  it('throws on an invalid date', () => {
    expect(() => formatPageTitle('not-a-date')).toThrow(RangeError);
    expect(() => formatPageTitle('2026-02-30')).toThrow(RangeError);
  });

  it('names every month', () => {
    const months = Array.from({ length: 12 }, (_, i) => formatPageTitle(`2026-${String(i + 1).padStart(2, '0')}-15`));
    expect(months.map((title) => title.split(' ')[2])).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]);
  });
});
