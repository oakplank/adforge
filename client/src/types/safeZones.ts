export interface SafeZoneConfig {
  /** Title safe zone margin as percentage of dimension */
  titleSafe: number;
  /** Action safe zone margin as percentage of dimension */
  actionSafe: number;
  /** Optional asymmetric overrides as fraction of height */
  topMargin?: number;
  bottomMargin?: number;
  /** Optional right margin override as fraction of width (e.g. for reels) */
  rightMargin?: number;
}

/** Safe zone configs per format - margins as fraction of canvas size */
export const SAFE_ZONES: Record<string, SafeZoneConfig> = {
  square: { titleSafe: 0.1, actionSafe: 0.05 },
  portrait: { titleSafe: 0.1, actionSafe: 0.05 },
  story: { titleSafe: 0.14, actionSafe: 0.05, topMargin: 0.14, bottomMargin: 0.35 },
  reel: { titleSafe: 0.14, actionSafe: 0.05, topMargin: 0.14, bottomMargin: 0.35, rightMargin: 0.15 },
};

export function getSafeZonePixels(
  formatId: string,
  width: number,
  height: number
): { titleSafe: { top: number; right: number; bottom: number; left: number }; actionSafe: { top: number; right: number; bottom: number; left: number } } {
  const config = SAFE_ZONES[formatId] ?? SAFE_ZONES.square;

  const topTitle = height * (config.topMargin ?? config.titleSafe);
  const bottomTitle = height * (config.bottomMargin ?? config.titleSafe);
  const rightTitle = width * (config.rightMargin ?? config.titleSafe);
  const leftTitle = width * config.titleSafe;

  return {
    titleSafe: {
      top: topTitle,
      right: rightTitle,
      bottom: bottomTitle,
      left: leftTitle,
    },
    actionSafe: {
      top: height * config.actionSafe,
      right: width * config.actionSafe,
      bottom: height * config.actionSafe,
      left: width * config.actionSafe,
    },
  };
}
