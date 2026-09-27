/**
 * The portal's data layer (js/data-adapter.js) is a classic script that defines
 * a top-level `const ICData`. Classic scripts share one global lexical scope, so
 * the gallery bundle can read it — this just tells TypeScript it exists.
 */
declare const ICData:
  | { getLiveProjects: () => Promise<unknown[]> }
  | undefined;

/** Side-effect stylesheet import in main.tsx (esbuild ignores it; Tailwind builds the CSS separately). */
declare module '*.css';
