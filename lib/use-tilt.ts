"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useRef } from "react";

/**
 * Cursor-driven tilt + light tracking.
 *
 * Writes four custom properties onto the returned ref's element:
 *  - `--rx` / `--ry` — perspective tilt angles
 *  - `--mx` / `--my` — gloss highlight position (as %)
 *
 * Custom properties inherit, so descendants (e.g. a slab's gloss layer) can
 * read `--mx`/`--my` even when the motion is driven by an ancestor wrapper.
 *
 * When `enabled` is false, no handlers are returned — so a disabled element
 * never overwrites custom properties it should be inheriting from an ancestor.
 */
export function useTilt<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${-py * 5}deg`);
      el.style.setProperty("--ry", `${px * 7}deg`);
      el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    },
    [],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "26%");
  }, []);

  const handlers = enabled ? { onPointerMove, onPointerLeave } : {};
  return { ref, handlers };
}
