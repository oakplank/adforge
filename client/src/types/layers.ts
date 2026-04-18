import type { FabricObject } from 'fabric';
import type { ShapeStyle, BackgroundStyle } from './shapes';

export type LayerType = 'image' | 'text' | 'shape' | 'background' | 'cta';

export interface LayerTransform {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
}

export type TokenRole = 'headline' | 'subhead' | 'body' | 'cta';

export interface BrandTextPreset {
  fontFamily: string;
  fontSizeMin: number;
  fontSizeMax: number;
  fontWeight: 'normal' | 'bold';
  letterSpacing: number;
  lineHeight: number;
}

export const BRAND_TEXT_PRESETS: Record<TokenRole, BrandTextPreset> = {
  headline: {
    fontFamily: 'Space Grotesk',
    fontSizeMin: 28,
    fontSizeMax: 72,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    lineHeight: 1.1,
  },
  subhead: {
    fontFamily: 'Manrope',
    fontSizeMin: 18,
    fontSizeMax: 36,
    fontWeight: 'normal',
    letterSpacing: 0,
    lineHeight: 1.3,
  },
  body: {
    fontFamily: 'Manrope',
    fontSizeMin: 14,
    fontSizeMax: 24,
    fontWeight: 'normal',
    letterSpacing: 0.1,
    lineHeight: 1.5,
  },
  cta: {
    fontFamily: 'Space Grotesk',
    fontSizeMin: 16,
    fontSizeMax: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
};

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  tokenRole?: TokenRole;
  shadow: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  } | null;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: BRAND_TEXT_PRESETS.headline.fontFamily,
  fontSize: BRAND_TEXT_PRESETS.headline.fontSizeMax,
  fill: '#ffffff',
  fontWeight: 'normal',
  fontStyle: 'normal',
  underline: false,
  textAlign: 'left',
  shadow: null,
};

export const AVAILABLE_FONTS = [
  'Space Grotesk',
  'Manrope',
  'Archivo Black',
  'Bebas Neue',
  'Playfair Display',
  'DM Serif Display',
] as const;

export interface CtaStyle {
  buttonColor: string;
  textContent: string;
  textColor: string;
  cornerRadius: number;
  paddingX: number;
  paddingY: number;
}

export const DEFAULT_CTA_STYLE: CtaStyle = {
  buttonColor: '#ff6a3d',
  textContent: 'Shop Now',
  textColor: '#ffffff',
  cornerRadius: 8,
  paddingX: BRAND_TEXT_PRESETS.cta.fontSizeMax,
  paddingY: Math.round(BRAND_TEXT_PRESETS.cta.fontSizeMax * 0.4),
};

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  fabricObject: FabricObject | null;
  transform?: LayerTransform;
  textStyle?: TextStyle;
  ctaStyle?: CtaStyle;
  shapeStyle?: ShapeStyle;
  backgroundStyle?: BackgroundStyle;
}
