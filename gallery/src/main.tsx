import { createRoot } from 'react-dom/client';
import { HomeGallery } from '@/components/home-gallery';
import './index.css';

/**
 * Mounts the circular gallery into the home page.
 * The mount point ships with a plain HTML fallback (six normal cards); React
 * replaces it on first render, and the `is-enhanced` class switches on the
 * tall scroll-driven layout (see css/home.css).
 */
const mount = document.getElementById('circular-gallery-root');
if (mount) {
  createRoot(mount).render(<HomeGallery />);
  mount.closest('.home-gallery')?.classList.add('is-enhanced');
}
