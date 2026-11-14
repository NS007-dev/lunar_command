/**
 * Render checks for unavailable choices (GitHub issue #3): they must stay reachable by keyboard
 * (aria-disabled, not `disabled`) and say why they are unavailable. Uses react-dom/server, no extra packages.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { init } from '../game/engine';
import { reason } from '../game/mentor';
import { K, type Gadget } from '../game/scenarios';
import type { GameState } from '../game/types';
import { TOO_MANY_GADGETS } from '../game/uiState';
import { GadgetSelection } from '../screens/GadgetSelection';
import { ActionButton } from './ActionButton';

const start = (): GameState => {
  const r = init(0, ['lab', 'garden']);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const noop = () => {};
const count = (html: string, s: string) => html.split(s).length - 1;

describe('action buttons', () => {
  it('an unavailable job is aria-disabled (still focusable) and shows the reason', () => {
    const s = { ...start(), shield: K.shieldCap };
    const html = renderToStaticMarkup(<ActionButton s={s} a="shelter" pressed={false} resolving={false} onPick={noop} />);
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain(reason('The shelter is as strong as it can be.', s));
  });
  it('an available job is not marked unavailable', () => {
    const html = renderToStaticMarkup(<ActionButton s={start()} a="shelter" pressed={false} resolving={false} onPick={noop} />);
    expect(html).not.toContain('aria-disabled');
    expect(html).not.toContain('class="why"');
  });
  it('all jobs are truly disabled while a shift is playing out', () => {
    const html = renderToStaticMarkup(<ActionButton s={start()} a="rest" pressed={false} resolving onPick={noop} />);
    expect(html).toContain('disabled=""');
  });
});

describe('gadget cards', () => {
  const render = (sel: Gadget[], message = '') =>
    renderToStaticMarkup(<GadgetSelection sc={0} sel={sel} message={message} onToggle={noop} onLaunch={noop} onChangeEvent={noop} />);
  it('with two picked, the other two cards say why they are unavailable and blast off is ready', () => {
    const html = render(['walls', 'garden']);
    expect(count(html, 'aria-disabled="true"')).toBe(2);
    expect(count(html, TOO_MANY_GADGETS)).toBe(2);
  });
  it('with fewer than two picked, blast off is marked unavailable but still reachable', () => {
    const html = render(['lab']);
    expect(count(html, 'aria-disabled="true"')).toBe(1);
    expect(html).not.toContain('disabled=""');
  });
  it("Pip says the refusal message", () => {
    expect(render(['walls', 'garden'], 'Pick 1 more gadget before blast off.')).toContain('Pick 1 more gadget before blast off.');
  });
});
