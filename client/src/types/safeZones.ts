export interface SafeZoneConfig {
  /** Title safe zone margin as percentage of dimension */
  titleSafe: number;
  /** Action safe zone margin as percentage of dimension */
  actionSafe: number;
}

/** Safe zone configs per format - margins as fraction of canvas size */
export const SAFE_ZONES: Record<string, SafeZoneConfig> = {
  square: { titleSafe: 0.1, actionSafe: 0.05 },
  portrait: { titleSafe: 0.1, actionSafe: 0.05 },
  story: { titleSafe: 0.15, actionSafe: 0.05 },
};

export function getSafeZonePixels(
  formatId: string,
  width: number,
  height: number
): { titleSafe: { top: number; right: number; bottom: number; left: number }; actionSafe: { top: number; right: number; bottom: number; left: number } } {
  const config = SAFE_ZONES[formatId] ?? SAFE_ZONES.square;
  return {
    titleSafe: {
      top: height * config.titleSafe,
      right: width * config.titleSafe,
      bottom: height * config.titleSafe,
      left: width * config.titleSafe,
    },
    actionSafe: {
      top: height * config.actionSafe,
      right: width * config.actionSafe,
      bottom: height * config.actionSafe,
      left: width * config.actionSafe,
    },
  };
}
