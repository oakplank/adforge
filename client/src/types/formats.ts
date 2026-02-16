export interface AdFormat {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const AD_FORMATS: AdFormat[] = [
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait', width: 1080, height: 1350 },
  { id: 'story', label: 'Story', width: 1080, height: 1920 },
];

export const DEFAULT_FORMAT = AD_FORMATS[0];
