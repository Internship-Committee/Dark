import { useEffect, useState } from 'react';

/**
 * Endless, page-pinning scroll for the home page.
 *
 * The page itself never scrolls. Instead this hook listens to the wheel / touch / keyboard,
 * accumulates the input into one "virtual scroll" distance and eases towards it:
 *
 *   0 ─────────── morphDist ───────────────────────────────▶ ∞
 *   hero  ──morph──▶  gallery ring …keeps spinning as long as you keep scrolling
 *
 *  - First `morphDist` px : the hero (logo + tagline) fades out while the ring assembles
 *                           around the centre (CSS variables on the stage element).
 *  - After that           : every extra px just rotates the ring — there is no end.
 *  - Scrolling back up    : rewinds the morph, so the hero comes back.
 *
 * It returns the ring's rotation (deg) and the 0→1 morph amount for <CircularGallery />,
 * and writes these CSS variables / classes onto the stage element for the hero layer:
 *   --m  --hero-out  --cue-out  --gal-in  --head-in     .at-hero  .is-live
 */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (n: number) => {
  const x = clamp01(n);
  return x * x * (3 - 2 * x); // smoothstep
};
const easeInOut = (n: number) => (n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2);

export interface ImmersiveScrollOptions {
  /** The pinned element that holds the hero and the gallery (`.home-stage`). */
  stage: HTMLElement;
  reducedMotion?: boolean;
  /** Degrees the ring turns per px of scroll. 0.18 → one full turn every 2000px. */
  degPerPx?: number;
  /** Extra spin (deg) the ring "unwinds" while it morphs in. */
  introSpin?: number;
  /** Slow idle drift (deg per second) once the gallery is showing and you stop scrolling. */
  driftDegPerSec?: number;
}

export interface ImmersiveFrame {
  rotation: number;
  intro: number;
}

export function useImmersiveScroll({
  stage,
  reducedMotion = false,
  degPerPx = 0.18,
  introSpin = 150,
  driftDegPerSec = 3,
}: ImmersiveScrollOptions): ImmersiveFrame {
  const startSpin = reducedMotion ? 0 : introSpin;
  const [frame, setFrame] = useState<ImmersiveFrame>({ rotation: -startSpin, intro: 0 });

  useEffect(() => {
    const getMorphDist = () => Math.min(900, Math.max(520, window.innerHeight * 0.85));
    let morphDist = getMorphDist();

    let target = 0; // where the input says we should be (px)
    let current = 0; // eased value actually shown (px)
    let inertia = 0; // touch fling velocity (px/ms)
    let driftDeg = 0;
    let lastInput = -Infinity;
    let tween: { from: number; to: number; t0: number; dur: number } | null = null;

    let touching = false;
    let dragDist = 0;
    let tx = 0;
    let ty = 0;
    let tLast = 0;

    let last = performance.now();
    let raf = 0;
    const prev = { rotation: Infinity, intro: Infinity };
    const cssCache: Record<string, string> = {};

    const setVar = (name: string, value: number) => {
      const v = value.toFixed(4);
      if (cssCache[name] !== v) {
        cssCache[name] = v;
        stage.style.setProperty(name, v);
      }
    };

    const push = (d: number) => {
      tween = null;
      target = Math.max(0, target + d);
      lastInput = performance.now();
    };

    const animateTo = (to: number, dur: number) => {
      tween = { from: target, to, t0: performance.now(), dur };
    };

    /** Jump back to the hero. Whole ring-turns of accumulated spin are dropped invisibly
        first (a full turn looks identical), so the rewind is never longer than one turn. */
    const goHome = () => {
      const wrapPx = 360 / degPerPx;
      const excess = Math.floor(Math.max(0, current - morphDist) / wrapPx) * wrapPx;
      current -= excess;
      target = Math.max(0, target - excess);
      animateTo(0, 1100);
    };

    /* ----------------------------- input ----------------------------- */
    const inSidebar = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest('.sidebar, .sidebar-scrim');

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || inSidebar(e.target)) return; // pinch-zoom / sidebar's own scrolling
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      // Vertical scroll spins the ring forwards; a sideways trackpad swipe spins it with your fingers.
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : e.deltaY;
      push(Math.max(-400, Math.min(400, d * unit)));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touching = true;
      dragDist = 0;
      inertia = 0;
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      tLast = e.timeStamp;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touching || e.touches.length !== 1) return;
      e.preventDefault();
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - tx;
      const dy = y - ty;
      tx = x;
      ty = y;
      // finger up = scroll down; finger sideways drags the ring with it
      const d = (Math.abs(dx) > Math.abs(dy) ? dx : -dy) * 1.5;
      dragDist += Math.abs(dx) + Math.abs(dy);
      const dt = Math.max(1, e.timeStamp - tLast);
      tLast = e.timeStamp;
      inertia = d / dt;
      push(d);
    };
    const onTouchEnd = () => {
      touching = false;
      inertia = Math.max(-2.5, Math.min(2.5, inertia)); // px/ms, keeps flings sane
    };
    // A drag that started on a card must not count as a click on it
    const onClickCapture = (e: MouseEvent) => {
      if (dragDist > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
      dragDist = 0;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (inSidebar(t)) return;
      const page = window.innerHeight * 0.8;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          push(140);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          push(-140);
          break;
        case 'PageDown':
          push(page);
          break;
        case 'PageUp':
          push(-page);
          break;
        case ' ':
          if (t && /^(A|BUTTON)$/.test(t.tagName)) return; // let Space activate focused controls
          push(e.shiftKey ? -page : page);
          break;
        case 'Home':
          goHome();
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    const cue = stage.querySelector<HTMLElement>('.hero-scroll-cue');
    const onCue = (e: Event) => {
      e.preventDefault();
      animateTo(morphDist, 1300);
    };
    const onResize = () => {
      morphDist = getMorphDist();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd);
    stage.addEventListener('touchcancel', onTouchEnd);
    stage.addEventListener('click', onClickCapture, true);
    cue?.addEventListener('click', onCue);

    /* ------------------------------ loop ----------------------------- */
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      if (tween) {
        const k = clamp01((now - tween.t0) / tween.dur);
        target = tween.from + (tween.to - tween.from) * easeInOut(k);
        lastInput = now;
        if (k >= 1) tween = null;
      }
      if (!touching && Math.abs(inertia) > 0.004) {
        target = Math.max(0, target + inertia * dt);
        inertia *= Math.exp(-dt / 320);
        lastInput = now;
      }

      // ease the shown position towards the target (frame-rate independent)
      current += (target - current) * (1 - Math.exp(-dt / 110));
      if (Math.abs(target - current) < 0.05) current = target;

      const m = clamp01(current / morphDist);
      const intro = smooth(m);

      // slow idle drift once the ring is fully out and the user has stopped scrolling
      if (!reducedMotion && m > 0.85 && now - lastInput > 200) {
        driftDeg += ((driftDegPerSec * dt) / 1000) * smooth((m - 0.85) / 0.15);
      }

      const spin = Math.max(0, current - morphDist) * degPerPx; // endless part
      const rotation = spin - (1 - intro) * startSpin + driftDeg;

      // hero layer + heading, driven from CSS
      setVar('--m', m);
      setVar('--hero-out', smooth(m / 0.55));
      setVar('--cue-out', smooth(m / 0.18));
      setVar('--gal-in', smooth((m - 0.12) / 0.88));
      setVar('--head-in', smooth((m - 0.55) / 0.45));
      stage.classList.toggle('at-hero', current < 0.5);
      stage.classList.toggle('is-live', m > 0.55);

      if (Math.abs(rotation - prev.rotation) > 0.004 || Math.abs(intro - prev.intro) > 0.0005) {
        prev.rotation = rotation;
        prev.intro = intro;
        setFrame({ rotation, intro });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
      stage.removeEventListener('click', onClickCapture, true);
      cue?.removeEventListener('click', onCue);
    };
  }, [stage, reducedMotion, degPerPx, introSpin, driftDegPerSec, startSpin]);

  return frame;
}
