import { useEffect, useState } from 'react';

/** Scroll distance (px) over which the hero morphs into the gallery. */
export const MORPH_DISTANCE = 700;
/** Ring rotation per px of scroll. With no upper limit, the ring can turn forever. */
const DEG_PER_PX = 0.2;
/** Gentle idle drift once the gallery is open. */
const DRIFT_DEG_PER_SEC = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export interface VirtualScrollState {
  /** Ring rotation in degrees (unbounded, either direction). */
  rotation: number;
  /** 0 = hero, 1 = fully morphed into the gallery (eased). */
  morph: number;
}

/**
 * The home page never scrolls natively. Wheel / touch / keyboard input moves a
 * *virtual* scroll position instead:
 *   0 … MORPH_DISTANCE   the hero smoothly morphs into the gallery
 *   MORPH_DISTANCE … ∞   the ring keeps rotating, with no end (scroll back up to return)
 * The eased morph value is also written to the stage as the CSS variable `--morph`,
 * which css/home.css uses to fade the hero out.
 */
export function useVirtualScroll(stage: HTMLElement, reducedMotion: boolean): VirtualScrollState {
  const [state, setState] = useState<VirtualScrollState>({ rotation: 0, morph: 0 });

  useEffect(() => {
    let target = 0;
    let current = 0;
    let drift = 0;
    let lastDir = 1;
    let raf = 0;
    let last = performance.now();
    let snapTimer: number | undefined;

    // A half-finished morph never sticks: once input stops, it completes in the
    // direction the user was scrolling.
    const scheduleSnap = () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        if (target > 0 && target < MORPH_DISTANCE) target = lastDir > 0 ? MORPH_DISTANCE : 0;
      }, 180);
    };
    const push = (dy: number) => {
      if (!dy) return;
      lastDir = dy > 0 ? 1 : -1;
      target = Math.max(0, target + dy);
      scheduleSnap();
    };

    /* ---- wheel / trackpad ---- */
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // let pinch-zoom through
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      push(clamp(raw * unit, -240, 240));
    };

    /* ---- touch (with a little momentum) ---- */
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0; // px per ms
    let dragged = false;
    let dragResetTimer: number | undefined;
    const onTouchStart = (e: TouchEvent) => {
      window.clearTimeout(dragResetTimer);
      startY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      velocity = 0;
      dragged = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dy = lastY - y;
      if (Math.abs(startY - y) > 8) dragged = true;
      if (dragged) {
        e.preventDefault();
        velocity = 0.7 * velocity + 0.3 * (dy / Math.max(1, now - lastT));
        push(dy * 1.6);
      }
      lastY = y;
      lastT = now;
    };
    const onTouchEnd = () => {
      if (dragged) push(clamp(velocity * 320, -900, 900));
      // swallow the click that follows a swipe so a swipe never opens a card
      dragResetTimer = window.setTimeout(() => (dragged = false), 350);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    /* ---- keyboard ---- */
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.sidebar'))) return;
      const onActionable = !!t?.closest('a, button');
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); push(140); break;
        case 'ArrowUp': e.preventDefault(); push(-140); break;
        case 'PageDown': e.preventDefault(); push(window.innerHeight * 0.8); break;
        case 'PageUp': e.preventDefault(); push(-window.innerHeight * 0.8); break;
        case ' ':
          if (onActionable) return; // Space still activates focused buttons / links
          e.preventDefault();
          push((e.shiftKey ? -1 : 1) * window.innerHeight * 0.8);
          break;
        case 'Home': e.preventDefault(); lastDir = -1; target = 0; break;
      }
    };

    /* ---- "Scroll to explore" button ---- */
    const cue = stage.querySelector<HTMLElement>('[data-scroll-cue]');
    const onCue = () => {
      lastDir = 1;
      target = Math.max(target, MORPH_DISTANCE);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd);
    stage.addEventListener('click', onClickCapture, true);
    window.addEventListener('keydown', onKey);
    cue?.addEventListener('click', onCue);

    /* ---- render loop ---- */
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // ease toward the target so wheel "notches" glide instead of jumping
      current = reducedMotion ? target : current + (target - current) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - current) < 0.05) current = target;

      const morph = Math.round(smoothstep(clamp(current / MORPH_DISTANCE, 0, 1)) * 10000) / 10000;
      if (!reducedMotion && current === target && morph >= 1) drift += DRIFT_DEG_PER_SEC * dt;
      const rotation = current * DEG_PER_PX + drift;

      stage.style.setProperty('--morph', String(morph));
      stage.classList.toggle('has-gallery', morph > 0.04);
      stage.classList.toggle('is-gallery', morph > 0.62);

      setState((prev) =>
        prev.morph === morph && Math.abs(prev.rotation - rotation) < 0.005 ? prev : { rotation, morph },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(snapTimer);
      window.clearTimeout(dragResetTimer);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('keydown', onKey);
      cue?.removeEventListener('click', onCue);
    };
  }, [stage, reducedMotion]);

  return state;
}
