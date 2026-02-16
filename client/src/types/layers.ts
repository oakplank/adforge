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

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  shadow: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  } | null;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Space Grotesk',
  fontSize: 48,
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
  paddingX: 32,
  paddingY: 12,
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
