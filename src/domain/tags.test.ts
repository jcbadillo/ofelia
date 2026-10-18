import { parseTags } from './tags';

describe('parseTags', () => {
  it('extracts unique lowercase tags', () => {
    expect(parseTags('Call #Work about #project-x and #work again')).toEqual(['work', 'project-x']);
  });

  it('accepts letters, numbers, dash and underscore', () => {
    expect(parseTags('#año_2026 #v2-final')).toEqual(['año_2026', 'v2-final']);
  });

  it('ignores hashes inside words and URLs fragments', () => {
    expect(parseTags('C# and https://x.dev/page#section')).toEqual([]);
  });

  it('returns an empty list for plain text', () => {
    expect(parseTags('nothing here')).toEqual([]);
  });
});
