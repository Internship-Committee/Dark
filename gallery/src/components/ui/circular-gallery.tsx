import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string; 
    text: string;
    pos?: string;
    /** Photographer credit. Optional — the "Photo by" line is only rendered when set. */
    by?: string;
  };
  /* --- Optional additions (all backward-compatible with the original API) --- */
  /** When set, the whole card becomes a link to this URL. */
  href?: string;
  /** Small call-to-action / status row rendered at the bottom of the card. */
  cta?: React.ReactNode;
  /** Small icon rendered in the card's top-left corner. */
  icon?: React.ReactNode;
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
  /**
   * Controlled rotation, in degrees. When provided, the gallery stops listening to the
   * page scroll and stops auto-rotating on its own — the parent drives the ring
   * (see lib/immersive-scroll.ts, which gives it an endless, wheel/touch-driven spin).
   */
  rotation?: number;
  /**
   * 0 → 1 "assemble" amount used for the hero → gallery morph. At 0 the ring is
   * collapsed, tilted and invisible; at 1 it is the normal full-size ring.
   */
  intro?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, rotation: rotationProp, intro = 1, ...props }, ref) => {
    const controlled = rotationProp !== undefined;
    const [internalRotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    // (browser-safe timer type — avoids needing @types/node)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastProgressRef = useRef<number | null>(null);

    // Effect to handle scroll-based rotation (skipped when the parent controls the rotation)
    useEffect(() => {
      if (controlled) return;
      const getProgress = () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        return scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      };
      lastProgressRef.current = getProgress();

      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Scrolling adds the *change* in scroll progress (a full page = 360°) to
        // the current rotation, rather than overwriting it. Same total travel as
        // before, but the ring no longer snaps back when auto-rotation has
        // drifted away from the scroll position.
        const progress = getProgress();
        const delta = progress - (lastProgressRef.current ?? progress);
        lastProgressRef.current = progress;
        setRotation(prev => prev + delta * 360);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, [controlled]);

    // Effect for auto-rotation when not scrolling (skipped when controlled)
    useEffect(() => {
      if (controlled) return;
      const autoRotate = () => {
        if (!isScrolling) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [controlled, isScrolling, autoRotateSpeed]);

    const rotation = rotationProp ?? internalRotation;
    const anglePerItem = 360 / items.length;

    // Morph-in: the ring opens up from the centre, tilts flat and fades in as `intro` goes 0 → 1
    const t = Math.min(1, Math.max(0, intro));
    const ringRadius = radius * (0.3 + 0.7 * t);
    const ringTilt = (1 - t) * 14;
    const cardScale = 0.75 + 0.25 * t;
    const introFade = Math.min(1, t * 1.6);

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center", className)}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateX(${ringTilt}deg) rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180)) * introFade;

            const cardClasses = "relative block w-full h-full rounded-lg shadow-2xl overflow-hidden group border border-border bg-card/70 dark:bg-card/30 backdrop-blur-lg";
            const cardBody = (
              <>
                <img
                  src={item.photo.url}
                  alt={item.photo.text}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: item.photo.pos || 'center' }}
                  // If a remote photo ever fails to load, fall back to the card's own background
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {item.icon && (
                  <span className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-black/40 text-white backdrop-blur-md">
                    {item.icon}
                  </span>
                )}
                {/* Replaced text-primary-foreground with text-white for consistent color */}
                <div className="absolute bottom-0 left-0 w-full p-4 pt-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
                  <h2 className="text-xl font-bold">{item.common}</h2>
                  <em className="text-sm italic opacity-80">{item.binomial}</em>
                  {item.photo.by && (
                    <p className="text-xs mt-2 opacity-70">Photo by: {item.photo.by}</p>
                  )}
                  {item.cta && (
                    <div className="mt-3 flex items-center gap-2 text-[13px] font-bold">{item.cta}</div>
                  )}
                </div>
              </>
            );

            return (
              <div
                key={item.photo.url} 
                role="group"
                aria-label={item.common}
                className="absolute w-[300px] h-[400px]"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${ringRadius}px) scale(${cardScale})`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-150px',
                  marginTop: '-200px',
                  opacity: opacity,
                  // When controlled, the parent already eases the motion — a CSS transition would only add lag
                  transition: controlled ? 'none' : 'opacity 0.3s linear',
                  // Cards facing away from the viewer are hidden instead of showing a mirrored back,
                  // so the text on real (non-photo) content stays legible.
                  backfaceVisibility: 'hidden',
                }}
              >
                {item.href ? (
                  <a href={item.href} className={cardClasses}>{cardBody}</a>
                ) : (
                  <div className={cardClasses}>{cardBody}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
