/**
 * Overlay (modal / panel) theme styles derived from isOverlayThemeDark.
 * Centralizes the dark/light class name logic used across SettingsPanel,
 * WeatherMoodTuningPanel, GenreSelector, etc.
 */

export interface OverlayStyles {
  container: string
  title: string
  muted: string
  buttonSelected: string
  buttonUnselected: string
  toggleOn: string
  toggleOff: string
  backButton: string
  border: string
}

const DARK: OverlayStyles = {
  container: "bg-slate-900/95 border-white/10",
  title: "text-white",
  muted: "text-white/60",
  buttonSelected: "bg-white text-slate-900 border-white hover:bg-white/90",
  buttonUnselected: "bg-transparent border-white/30 text-white/80 hover:bg-white/10",
  toggleOn: "bg-white text-slate-900 border-white hover:bg-white/90",
  toggleOff: "bg-transparent border-white/30 text-white/80 hover:bg-white/10",
  backButton: "text-white/80 hover:text-white hover:bg-white/10",
  border: "border-white/10",
}

const LIGHT: OverlayStyles = {
  container: "bg-background/80 border-border/50",
  title: "text-foreground",
  muted: "text-muted-foreground",
  buttonSelected: "",
  buttonUnselected: "",
  toggleOn: "",
  toggleOff: "",
  backButton: "text-muted-foreground hover:text-foreground",
  border: "border-border/50",
}

export function getOverlayStyles(isDark: boolean): OverlayStyles {
  return isDark ? DARK : LIGHT
}
