import confettiFn, { type Options } from "canvas-confetti";

const DEFAULT_OPTIONS: Options = {
  particleCount: 200,
  spread: 80,
  origin: { y: 0.5 },
};

export function confetti(options?: Options) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  return confettiFn({ ...DEFAULT_OPTIONS, ...options });
}
