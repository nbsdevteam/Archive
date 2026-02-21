import { useMemo } from "react";
import {
  hexToRgbTriplet,
  rgbTripletToCss,
  rgbTripletToHex,
  toRgbTriplet,
} from "../../../utils/color";

export type ColorPickerChangeMeta = {
  hex: string;
  rgbTriplet: string;
};

export type ColorPickerProps = {
  /** Current color: "#rrggbb", "rgb(...)", or theme triplet "r,g,b". */
  value?: string;
  /** Called with CSS rgb string and theme triplet for store. */
  onChange: (rgbCss: string, meta: ColorPickerChangeMeta) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Shared color picker using native <input type="color">.
 * Emits rgbTriplet "r,g,b" for themeColorStore compatibility.
 */
export const ColorPicker = ({
  value,
  onChange,
  ariaLabel = "Pick a color",
  disabled,
  className,
}: ColorPickerProps) => {
  const resolvedHex = useMemo(() => {
    const triplet = value ? toRgbTriplet(value) : null;
    const hex = triplet ? rgbTripletToHex(triplet) : null;
    return hex ?? "#000000";
  }, [value]);

  return (
    <input
      type="color"
      className={className}
      value={resolvedHex}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        const hex = e.target.value;
        const triplet = hexToRgbTriplet(hex);
        if (!triplet) return;
        onChange(rgbTripletToCss(triplet), { hex, rgbTriplet: triplet });
      }}
    />
  );
};
