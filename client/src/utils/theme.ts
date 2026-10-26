/**
 * Theme & Branding utility for Digital Industrial Work-Flow System (DIWS)
 * Handles applying custom primary (forest) and accent (copper) colors across the application.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 23, g: 58, b: 42 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustBrightness(hex: string, percent: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c + (255 - c) * (percent / 100))));
    const adjustDark = (c: number) => Math.min(255, Math.max(0, Math.round(c * (1 + percent / 100))));
    const newR = percent > 0 ? adjust(r) : adjustDark(r);
    const newG = percent > 0 ? adjust(g) : adjustDark(g);
    const newB = percent > 0 ? adjust(b) : adjustDark(b);
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  } catch (_) {
    return hex;
  }
}

export function applyTheme(primary: string, copper: string): void {
  if (!primary || !copper) return;
  const root = document.documentElement;
  const primaryDark = adjustBrightness(primary, -30);
  const primaryLight = adjustBrightness(primary, 25);
  const copperLight = adjustBrightness(copper, 25);
  const copperDark = adjustBrightness(copper, -20);

  root.style.setProperty('--forest', primary);
  root.style.setProperty('--forest-dark', primaryDark);
  root.style.setProperty('--forest-light', primaryLight);
  root.style.setProperty('--primary-accent', primary);
  root.style.setProperty('--primary-hover', primaryLight);

  root.style.setProperty('--copper', copper);
  root.style.setProperty('--copper-light', copperLight);
  root.style.setProperty('--copper-dark', copperDark);
  root.style.setProperty('--copper-accent', copper);
  root.style.setProperty('--copper-hover', copperLight);

  try {
    localStorage.setItem('diws_theme', JSON.stringify({ primary, copper }));
  } catch (_) {}
}

export function initTheme(): void {
  try {
    const saved = localStorage.getItem('diws_theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.primary && parsed.copper) {
        applyTheme(parsed.primary, parsed.copper);
      }
    }
  } catch (_) {}
}
