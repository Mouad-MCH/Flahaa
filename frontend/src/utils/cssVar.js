/** Chart.js draws to a <canvas> — it can't read Tailwind classes, so resolve a design token to its real color. */
export function cssVar(name) {
  if (typeof window === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
