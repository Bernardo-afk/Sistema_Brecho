// Heurística simples de qualidade gráfica: reduz resolução de panoramas e
// sombras/antialias do 3D em celulares e aparelhos modestos.
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = window.matchMedia('(max-width: 768px)').matches;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const saveData = (nav as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
  return small || lowMem || fewCores || !!saveData;
}

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
