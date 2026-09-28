import type { DisplayFont } from "../types";

export const DISPLAY_FONT_OPTIONS: { value: DisplayFont; label: string }[] = [
  { value: "system", label: "Modern sans serif" },
  { value: "trade-gothic", label: "Trade Gothic" },
  { value: "sabon", label: "Sabon" },
];

export function displayFontStack(font: DisplayFont) {
  if (font === "trade-gothic")
    return '"Trade Gothic LT Std", "Arial Narrow", Arial, sans-serif';
  if (font === "sabon") return '"Sabon LT Std", Georgia, serif';
  return '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
}
