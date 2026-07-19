// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }


import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes efficiently without style collisions.
 * Resolves v4/v3 utility overrides dynamically.
 * 
 * @param inputs - Array of class values, objects, or conditional strings.
 * @returns A consolidated, clean className string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}