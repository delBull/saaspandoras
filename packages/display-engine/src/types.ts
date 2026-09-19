export type SovereignDisplayScale = "100" | "115" | "130";
export type SovereignDisplayTheme = "base" | "high-contrast" | "sepia" | "grayscale" | "low-light";

export type SovereignDisplayProfile = {
  scale: SovereignDisplayScale;
  theme: SovereignDisplayTheme;
  magnifier: boolean;
  reducedMotion: boolean;
};

export type SovereignDisplayContextType = {
  profile: SovereignDisplayProfile;
  setProfile: (profile: Partial<SovereignDisplayProfile>) => void;
  resetToDefaults: () => void;
};
