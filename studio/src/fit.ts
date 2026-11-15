import type { RefObject } from "react";
import { useLayoutEffect, useState } from "react";

export interface Size {
  w: number;
  h: number;
}

/**
 * Scale that makes content of `natural` size fill `room` while keeping its proportions, capped at
 * `max`. Never below 1: content wider than the room keeps its size and scrolls instead of shrinking
 * into unreadable text. Rounded down to 1/100 so a re-measure can't oscillate.
 */
export function fitScale(natural: Size, room: Size, max: number): number {
  if (natural.w <= 0 || natural.h <= 0 || room.w <= 0 || room.h <= 0) return 1;
  const s = Math.min(max, room.w / natural.w, room.h / natural.h);
  return Math.max(1, Math.floor(s * 100) / 100);
}

/**
 * Live `fitScale` of `inner` (measured unscaled: transforms don't change offset sizes) inside
 * `outer`'s width, and `maxHeight` or, when omitted, `outer`'s own height (a fill container).
 */
export function useFitScale(
  outer: RefObject<HTMLElement | null>,
  inner: RefObject<HTMLElement | null>,
  { max, maxHeight }: { max: number; maxHeight?: number },
): { scale: number; natural: Size } {
  const [fit, setFit] = useState({ scale: 1, natural: { w: 0, h: 0 } });
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const natural = { w: i.offsetWidth, h: i.offsetHeight };
      const room = { w: o.clientWidth, h: maxHeight ?? o.clientHeight };
      const scale = fitScale(natural, room, max);
      setFit((f) =>
        f.scale === scale && f.natural.w === natural.w && f.natural.h === natural.h
          ? f
          : { scale, natural },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [outer, inner, max, maxHeight]);
  return fit;
}
