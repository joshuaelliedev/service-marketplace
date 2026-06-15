/**
 * Color Hunt palette: https://colorhunt.co/palette/1118444b56947288aeeae0cf
 */
export const palette = {
  navy: "#111844",
  indigo: "#4B5694",
  slate: "#7288AE",
  cream: "#EAE0CF",
} as const;

export type PaletteColor = (typeof palette)[keyof typeof palette];

/** Semantic tokens mapped from the palette — use in JS/RN StyleSheet. */
export const colors = {
  background: palette.cream,
  surface: "#FFFFFF",
  text: palette.navy,
  textMuted: palette.indigo,
  textSubtle: palette.slate,
  primary: palette.indigo,
  primaryHover: "#3D467D",
  primaryText: "#FFFFFF",
  secondary: palette.slate,
  border: palette.slate,
  borderLight: "rgba(114, 136, 174, 0.35)",
  codeBackground: "rgba(114, 136, 174, 0.18)",
  headerBackground: palette.navy,
  headerText: palette.cream,
  error: "#9B2C2C",
  link: palette.indigo,
  linkHover: palette.navy,
} as const;

export type ThemeColor = (typeof colors)[keyof typeof colors];

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  lineHeight: 1.5,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 18,
  sizeXl: 22,
  sizeH1: 28,
  weightNormal: "400" as const,
  weightSemibold: "600" as const,
  weightBold: "700" as const,
};
