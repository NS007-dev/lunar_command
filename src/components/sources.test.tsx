/** Sources panel: NASA Moon Base Systems link is listed, labeled as real research, and the game rules stay marked as made up. */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SOURCES } from '../data/scienceFacts';
import { Sources } from './Sources';

describe('Sources panel', () => {
  const html = renderToStaticMarkup(<Sources />);

  it('lists the NASA Moon Base Systems page', () => {
    expect(SOURCES.some(s => s.url === 'https://www.nasa.gov/moonbase-systems/')).toBe(true);
    expect(html).toContain('href="https://www.nasa.gov/moonbase-systems/"');
  });

  it('separates real NASA research from made-up game rules', () => {
    expect(html).toContain('Real NASA research');
    expect(html).toMatch(/solar power, the battery/);
    expect(html).toMatch(/does not use live NASA data/);
  });

  it('keeps all NOAA sources', () => {
    expect(SOURCES.filter(s => /NOAA/.test(s.text)).length).toBe(7);
  });
});
