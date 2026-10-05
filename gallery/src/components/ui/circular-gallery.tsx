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
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    // (browser-safe timer type — avoids needing @types/node)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastProgressRef = useRef<number | null>(null);

    // Effect to handle scroll-based rotation
    useEffect(() => {
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
    }, []);

    // Effect for auto-rotation when not scrolling
    useEffect(() => {
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
    }, [isScrolling, autoRotateSpeed]);

    const anglePerItem = 360 / items.length;
    
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
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));

            const cardClasses = "relative block w-full h-full rounded-[20px] overflow-hidden group border border-white/30 bg-[#1d1d1d]";
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
                  <span className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-sm border border-white/40 bg-[#131313] text-[#3CFFD0]">
                    {item.icon}
                  </span>
                )}
                {/* Replaced text-primary-foreground with text-white for consistent color */}
                <div className="absolute bottom-0 left-0 w-full border-t border-white/25 bg-[#131313] p-4 text-white">
                  <h2 className="text-xl font-bold uppercase">{item.common}</h2>
                  <em className="text-sm not-italic opacity-80">{item.binomial}</em>
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
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-150px',
                  marginTop: '-200px',
                  opacity: opacity,
                  transition: 'opacity 0.3s linear',
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
