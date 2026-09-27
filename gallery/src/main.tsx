import { createRoot } from 'react-dom/client';
import { HomeGallery } from '@/components/home-gallery';
import './index.css';

/**
 * Mounts the circular gallery into the home page stage.
 * Until this runs, the page shows a plain-HTML fallback (six normal cards).
 * `is-enhanced` switches the stage to the full-screen, no-native-scroll layout
 * (see css/home.css); the scroll-driven morph itself lives in hooks/use-virtual-scroll.ts.
 */
const mount = document.getElementById('circular-gallery-root');
const stage = document.getElementById('home-stage');
if (mount && stage) {
  stage.classList.add('is-enhanced');
  document.documentElement.classList.add('ic-home-locked');
  createRoot(mount).render(<HomeGallery stage={stage} />);
}
