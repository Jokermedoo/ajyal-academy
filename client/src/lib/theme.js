// Applies the academy identity (colors + font) coming from admin settings
// by writing CSS variables used by Tailwind's brand/accent palettes.

const BRAND_FALLBACK = '#1e6fe6';
const ACCENT_FALLBACK = '#f97316';

function normalizeHex(input, fallback) {
  const v = String(input || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  }
  return fallback;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mix(rgb, target, ratio) {
  return rgb.map((c, i) => Math.round(c + (target[i] - c) * ratio));
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function palette(hex) {
  const base = hexToRgb(hex);
  return {
    50: mix(base, WHITE, 0.95),
    100: mix(base, WHITE, 0.88),
    200: mix(base, WHITE, 0.74),
    300: mix(base, WHITE, 0.52),
    400: mix(base, WHITE, 0.32),
    500: mix(base, WHITE, 0.16),
    600: base,
    700: mix(base, BLACK, 0.15),
    800: mix(base, BLACK, 0.3),
    900: mix(base, BLACK, 0.45),
  };
}

export function applyTheme(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const brand = palette(normalizeHex(settings?.primary_color, BRAND_FALLBACK));
  const accent = palette(normalizeHex(settings?.secondary_color, ACCENT_FALLBACK));
  for (const [shade, rgb] of Object.entries(brand)) root.style.setProperty(`--brand-${shade}`, rgb.join(' '));
  for (const [shade, rgb] of Object.entries(accent)) root.style.setProperty(`--accent-${shade}`, rgb.join(' '));

  const font = settings?.font_family || 'Tajawal';
  root.style.setProperty('--font-sans', `"${font}", system-ui, sans-serif`);
  document.body.style.fontFamily = `"${font}", system-ui, sans-serif`;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', normalizeHex(settings?.primary_color, BRAND_FALLBACK));

  const favicon = settings?.favicon_url;
  if (favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
  }
}
