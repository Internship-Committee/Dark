import { createRoot } from 'react-dom/client';
import { HomeExperience } from '@/components/home-experience';
import './index.css';

/**
 * Mounts the home-page experience (hero → circular gallery morph, endless scroll).
 *
 * The page ships with plain HTML for both the hero and a six-card fallback. When this
 * script runs it adds `is-enhanced` to `.home-stage` (pins hero + gallery into one
 * viewport, see css/home.css) and `home-immersive` to <html> (the page stops scrolling —
 * the wheel / touch / keys drive the animation instead, see lib/immersive-scroll.ts).
 */
const mount = document.getElementById('circular-gallery-root');
const stage = document.querySelector<HTMLElement>('.home-stage');
if (mount && stage) {
  createRoot(mount).render(<HomeExperience stage={stage} />);
  stage.classList.add('is-enhanced', 'at-hero');
  document.documentElement.classList.add('home-immersive');
}
