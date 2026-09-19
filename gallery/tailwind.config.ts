import type { Config } from "tailwindcss";

/**
 * The portal's own stylesheet (css/*.css) is hand-written, so Tailwind here is
 * deliberately *scoped* so it can never leak into the rest of the site:
 *   - `important` prefixes every utility with the gallery's mount-point id
 *   - `preflight` (Tailwind's global reset) is off; a tiny scoped reset lives in
 *     src/index.css instead
 */
const config: Config = {
  darkMode: ["class"],
  important: "#circular-gallery-root",
  content: ["./src/**/*.{ts,tsx}", "!./src/demo.tsx"], // demo.tsx is a reference example, not shipped on the site
  corePlugins: { preflight: false, container: false },
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
