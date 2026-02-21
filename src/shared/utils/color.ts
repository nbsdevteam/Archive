/**
 * Color conversion utilities for theme and UI.
 * Theme store uses RGB triplet string "r,g,b"; these helpers bridge hex and rgb(...).
 */

type Rgb = { r: number; g: number; b: number };

const clampByte = (n: number): number =>
  Math.min(255, Math.max(0, Math.round(n)));

const toHex2 = (n: number): string =>
  clampByte(n).toString(16).padStart(2, "0");

const parseHex = (value: string): Rgb | null => {
  const raw = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(raw)) return null;
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const parseRgbLike = (value: string): Rgb | null => {
  const v = value.trim();
  const tripletMatch = v.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (tripletMatch) {
    return {
      r: clampByte(Number(tripletMatch[1])),
      g: clampByte(Number(tripletMatch[2])),
      b: clampByte(Number(tripletMatch[3])),
    };
  }
  const cssMatch = v.match(
    /^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*[0-9.]+)?\s*\)$/i
  );
  if (!cssMatch) return null;
  return {
    r: clampByte(Number(cssMatch[1])),
    g: clampByte(Number(cssMatch[2])),
    b: clampByte(Number(cssMatch[3])),
  };
};

/** Theme RGB triplet "r,g,b" to CSS rgb(...). */
export const rgbTripletToCss = (triplet: string): string => {
  const rgb = parseRgbLike(triplet);
  if (!rgb) return "";
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

/** Hex "#rgb" / "#rrggbb" to theme triplet "r,g,b". */
export const hexToRgbTriplet = (hex: string): string | null => {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return `${clampByte(rgb.r)},${clampByte(rgb.g)},${clampByte(rgb.b)}`;
};

/** Theme triplet "r,g,b" to hex "#rrggbb". */
export const rgbTripletToHex = (triplet: string): string | null => {
  const rgb = parseRgbLike(triplet);
  if (!rgb) return null;
  return `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
};

/**
 * Normalize any color value to theme triplet "r,g,b".
 * Accepts "#rgb", "#rrggbb", "rgb(r,g,b)", "rgba(r,g,b,a)", or "r,g,b".
 */
export const toRgbTriplet = (value: string): string | null => {
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("#")) return hexToRgbTriplet(v);
  const rgb = parseRgbLike(v);
  if (!rgb) return null;
  return `${rgb.r},${rgb.g},${rgb.b}`;
};
