"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Cursor-driven tilt + light tracking.
 *
 * Writes four custom properties onto the returned ref's element:
 *  - `--rx` / `--ry` — perspective tilt angles
 *  - `--mx` / `--my` — gloss highlight position (as %)
 *
 * Custom properties inherit, so descendants (e.g. a slab's gloss layer or the
 * card-foil sheen) can read `--mx`/`--my` even when the motion is driven by an
 * ancestor wrapper.
 *
 * When `enabled` is false, or the user prefers reduced motion, no handlers
 * are returned. So the element never overwrites custom properties it should be
 * inheriting from an ancestor, and the slab renders fully at its rest state:
 * no tilt and no gloss/foil tracking. That, plus the `motion-reduce:` transform
 * resets in the markup, is the complete reduced-motion static fallback.
 */
export function useTilt<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();
  const active = enabled && !reduced;

  const onPointerMove = useCallback((e: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${-py * 5}deg`);
    el.style.setProperty("--ry", `${px * 7}deg`);
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    // Unitless 0–1 twins of --mx/--my, so edge rails can drive their opacity
    // off the same light position via calc() (percentages can't divide cleanly).
    el.style.setProperty("--lx", `${px + 0.5}`);
    el.style.setProperty("--ly", `${py + 0.5}`);
  }, []);

  const onPointerLeave = useCallback(() => resetTiltVars(ref.current), []);

  useEffect(() => {
    if (!active) resetTiltVars(ref.current);
  }, [active]);

  const handlers = active ? { onPointerMove, onPointerLeave } : {};
  return { ref, handlers };
}

function resetTiltVars(el: HTMLElement | null) {
  if (!el) return;
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
  el.style.setProperty("--mx", "50%");
  el.style.setProperty("--my", "26%");
  el.style.setProperty("--lx", "0.5");
  el.style.setProperty("--ly", "0.26");
}

/**
 * Reactive `prefers-reduced-motion`. SSR-safe: starts `false` (matching the
 * server render so hydration is stable), then updates after mount and tracks
 * live changes to the media query.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
