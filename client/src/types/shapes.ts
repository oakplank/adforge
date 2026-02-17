export type ShapeKind = 'rectangle' | 'circle' | 'line' | 'gradient-band';

export interface LinearGradientStyle {
  startColor: string;
  endColor: string;
  startOpacity: number;
  endOpacity: number;
  angle: number; // degrees
}

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  fillMode: 'solid' | 'gradient';
  gradient: LinearGradientStyle;
}

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fill: '#6366f1',
  stroke: '#000000',
  strokeWidth: 0,
  cornerRadius: 0,
  fillMode: 'solid',
  gradient: {
    startColor: '#1E4D3A',
    endColor: '#1E4D3A',
    startOpacity: 0,
    endOpacity: 0.78,
    angle: 0,
  },
};

export interface GradientStop {
  offset: number;
  color: string;
}

export interface BackgroundStyle {
  type: 'solid' | 'gradient';
  color: string;
  gradient?: {
    stops: [GradientStop, GradientStop];
    angle: number; // degrees
  };
}

export const DEFAULT_BACKGROUND_STYLE: BackgroundStyle = {
  type: 'solid',
  color: '#1e1e2e',
};
