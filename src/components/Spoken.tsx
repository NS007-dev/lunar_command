import { Fragment } from 'react';
import { ARROW } from '../game/mentor';

/**
 * Shows `text` exactly as written, but screen readers hear each "→" as "to" instead of "right arrow"
 * (so "Battery power 5 → 4" is read as "Battery power 5 to 4").
 */
export function Spoken({ text }: { text: string }) {
  const parts = text.split(ARROW);
  return <>{parts.map((p, i) => (
    <Fragment key={i}>
      {i > 0 && <><span aria-hidden="true">{ARROW}</span><span className="sr-only">to</span></>}
      {p}
    </Fragment>
  ))}</>;
}
