import { HomeGallery, usePrefersReducedMotion } from '@/components/home-gallery';
import { useImmersiveScroll } from '@/lib/immersive-scroll';

/**
 * The whole home-page interaction: the hero and the gallery share one pinned screen,
 * and an endless wheel / touch / keyboard scroll first morphs the hero into the ring,
 * then keeps the ring spinning for as long as the visitor scrolls.
 */
export function HomeExperience({ stage }: { stage: HTMLElement }) {
  const reducedMotion = usePrefersReducedMotion();
  const { rotation, intro } = useImmersiveScroll({ stage, reducedMotion });
  return <HomeGallery rotation={rotation} intro={intro} />;
}
