import { toLocalDate } from './dates';

describe('toLocalDate', () => {
  it('formats the local calendar day with zero padding', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
