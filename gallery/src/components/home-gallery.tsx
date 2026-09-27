import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';

/* ------------------------------------------------------------------
   Icons — the same Lucide glyphs the sidebar already uses, kept inline so
   the gallery has no extra runtime dependency. (Swap for `lucide-react`
   imports whenever you like: Rocket, BookOpen, Trophy, FileText, Compass, Code.)
   ------------------------------------------------------------------ */
const Svg = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const RocketIcon = () => (
  <Svg>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 19 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-2.23 2-3c1.62-.87 4 0 4 0" />
    <path d="M12 15v5s2.23-.55 3-2c.87-1.62 0-4 0-4" />
  </Svg>
);
const BookIcon = () => (
  <Svg>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
    <path d="M4 19.5V6.5" />
  </Svg>
);
const TrophyIcon = () => (
  <Svg>
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3a4 4 0 0 1-4 4M7 5H4a4 4 0 0 0 4 4" />
  </Svg>
);
const FileIcon = () => (
  <Svg>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Svg>
);
const CompassIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-2 6-6 2 2-6 6-2z" />
  </Svg>
);
const CodeIcon = () => (
  <Svg>
    <path d="M8 9l-4 4 4 4M16 9l4 4-4 4" />
  </Svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

/* ------------------------------------------------------------------
   Card content
   ------------------------------------------------------------------ */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const Explore = ({ label = 'Explore' }: { label?: string }) => (
  <span className="inline-flex items-center gap-2 text-sky-300">
    {label} <ArrowRight />
  </span>
);

/** Mirrors the old home-page badge: pulsing red dot when applications are open, muted when closed. */
const LiveBadge = ({ open }: { open: boolean }) => (
  <span className={`gallery-live-badge${open ? '' : ' is-closed'}`}>
    <span className="gallery-live-dot" />
    {open ? 'Applications open' : 'Applications closed'}
    <ArrowRight />
  </span>
);

function buildItems(liveOpen: boolean): GalleryItem[] {
  return [
    {
      common: 'Live Projects',
      binomial: 'Active industry projects, with full role details on the site.',
      photo: { url: unsplash('1522071820081-009f0129c71c'), text: 'A team collaborating around a table with laptops', pos: '50% 40%' },
      href: 'live-projects.html',
      icon: <RocketIcon />,
      cta: <LiveBadge open={liveOpen} />,
    },
    {
      common: 'Course Repository',
      binomial: 'Domain-wise learning resources with price, rating and a direct link.',
      photo: { url: unsplash('1481627834876-b7833e8f5570'), text: 'A library with tall shelves full of books', pos: '50% 50%' },
      href: 'courses.html',
      icon: <BookIcon />,
      cta: <Explore />,
    },
    {
      common: 'Case Competitions',
      binomial: 'Compete in analysing and solving real-world business problems.',
      photo: { url: unsplash('1552664730-d307ca884978'), text: 'A group of people in a working meeting', pos: '50% 45%' },
      href: 'case-competitions.html',
      icon: <TrophyIcon />,
      cta: <Explore label="View competitions" />,
    },
    {
      common: 'Case Studies',
      binomial: 'Written case studies from the IC research cell and student contributors.',
      photo: { url: unsplash('1454165804606-c3d57bc86b40'), text: 'Desk with a laptop, charts and papers for business analysis', pos: '50% 50%' },
      href: 'case-studies.html',
      icon: <FileIcon />,
      cta: <Explore />,
    },
    {
      common: 'IIMR Student Resources',
      binomial: 'Databases and tools students use, with login requirements made clear.',
      photo: { url: unsplash('1523240795612-9a054b0db644'), text: 'Students talking together in a group', pos: '50% 40%' },
      href: 'iimr-resources.html',
      icon: <CompassIcon />,
      cta: <Explore />,
    },
    {
      common: 'GitHub Repositories',
      binomial: 'A directory pointing to useful repositories, not a copy of them.',
      photo: { url: unsplash('1461749280684-dccba630e2f6'), text: 'Source code on a computer monitor', pos: '50% 50%' },
      href: 'github-repositories.html',
      icon: <CodeIcon />,
      cta: <Explore />,
    },
  ];
}

/* ------------------------------------------------------------------
   Hooks
   ------------------------------------------------------------------ */

/** Defaults to "open" and only flips to "closed" when the data layer confirms there are no live projects
    (same rule the old home page used — a network hiccup must not show a misleading "closed"). */
function useLiveProjectsOpen(): boolean {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof ICData === 'undefined') return;
        const projects = await ICData.getLiveProjects();
        if (!cancelled && !projects.length) setOpen(false);
      } catch {
        /* keep the default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return open;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** The gallery's cards are a fixed 300×400px, so shrink the whole ring to fit smaller stages. */
function useFitScale(ref: RefObject<HTMLDivElement | null>): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const next = Math.min(1, Math.max(0.6, Math.min(width / 520, height / 560)));
      setScale(next);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

/* ------------------------------------------------------------------
   Home page gallery
   ------------------------------------------------------------------ */
export function HomeGallery({ rotation, intro }: { rotation?: number; intro?: number } = {}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(stageRef);
  const reducedMotion = usePrefersReducedMotion();
  const liveOpen = useLiveProjectsOpen();
  const items = buildItems(liveOpen);
  // Tighter ring on narrow screens so the neighbouring cards still peek in at the sides
  const radius = Math.round(340 + 90 * ((scale - 0.6) / 0.4));

  return (
    <div ref={stageRef} className="w-full h-full">
      <div
        className="w-full h-full"
        style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}
      >
        <CircularGallery
          items={items}
          radius={radius}
          autoRotateSpeed={reducedMotion ? 0 : 0.05}
          rotation={rotation}
          intro={intro}
        />
      </div>
    </div>
  );
}
