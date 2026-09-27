import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Standard shadcn helper — used by any component added later with `npx shadcn add`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
