import { Shadow } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { AVAILABLE_FONTS, DEFAULT_TEXT_STYLE, BRAND_TEXT_PRESETS } from '../types/layers';
import type { TextStyle, TokenRole } from '../types/layers';

export function TypographyControls() {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const updateTextStyle = useLayerStore((s) => s.updateTextStyle);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  if (!selectedLayer || selectedLayer.type !== 'text') return null;

  const style: TextStyle = selectedLayer.textStyle ?? DEFAULT_TEXT_STYLE;

  const currentRole: TokenRole | 'custom' = style.tokenRole ?? 'custom';

  const handleRoleChange = (role: TokenRole | 'custom') => {
    if (role === 'custom') {
      update({ tokenRole: undefined });
    } else {
      const preset = BRAND_TEXT_PRESETS[role];
      const clampedSize = Math.min(Math.max(style.fontSize, preset.fontSizeMin), preset.fontSizeMax);
      update({
        tokenRole: role,
        fontFamily: preset.fontFamily,
        fontWeight: preset.fontWeight,
        fontSize: clampedSize,
      });
    }
  };

  const fontSizeMin = currentRole !== 'custom' ? BRAND_TEXT_PRESETS[currentRole].fontSizeMin : 1;
  const fontSizeMax = currentRole !== 'custom' ? BRAND_TEXT_PRESETS[currentRole].fontSizeMax : 500;

  const update = (partial: Partial<TextStyle>) => {
    if (!selectedLayerId) return;
    updateTextStyle(selectedLayerId, partial);

    // Sync to fabric object
    const obj = selectedLayer.fabricObject;
    if (obj && typeof obj.set === 'function') {
      for (const [key, value] of Object.entries(partial)) {
        if (key === 'shadow') {
          if (value) {
            const s = value as NonNullable<TextStyle['shadow']>;
            obj.set('shadow', new Shadow({
              offsetX: s.offsetX,
              offsetY: s.offsetY,
              blur: s.blur,
              color: s.color,
            }));
          } else {
            obj.set('shadow', null);
          }
        } else {
          obj.set(key as string, value);
        }
      }
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  };

  return (
    <div className="space-y-3" data-testid="typography-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Typography</div>

      {/* Token Role */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-10 shrink-0">Role</label>
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as TokenRole | 'custom')}
          className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
          data-testid="typo-token-role"
        >
          <option value="headline">Headline</option>
          <option value="subhead">Subhead</option>
          <option value="body">Body</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Font Family */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-10 shrink-0">Font</label>
        <select
          value={style.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
          data-testid="typo-font-family"
        >
          {AVAILABLE_FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-10 shrink-0">Size</label>
        <input
          type="number"
          value={style.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
          min={fontSizeMin}
          max={fontSizeMax}
          className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
          data-testid="typo-font-size"
        />
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-10 shrink-0">Color</label>
        <input
          type="color"
          value={style.fill}
          onChange={(e) => update({ fill: e.target.value })}
          className="w-8 h-6 bg-transparent border-0 cursor-pointer"
          data-testid="typo-color"
        />
        <span className="text-xs text-zinc-400">{style.fill}</span>
      </div>

      {/* Bold / Italic / Underline */}
      <div className="flex gap-1">
        <button
          onClick={() => update({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={`px-2 py-1 text-xs rounded ${style.fontWeight === 'bold' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}
          data-testid="typo-bold"
        >
          B
        </button>
        <button
          onClick={() => update({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={`px-2 py-1 text-xs rounded italic ${style.fontStyle === 'italic' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}
          data-testid="typo-italic"
        >
          I
        </button>
        <button
          onClick={() => update({ underline: !style.underline })}
          className={`px-2 py-1 text-xs rounded underline ${style.underline ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}
          data-testid="typo-underline"
        >
          U
        </button>
      </div>

      {/* Text Alignment */}
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as const).map((align) => (
          <button
            key={align}
            onClick={() => update({ textAlign: align })}
            className={`px-2 py-1 text-xs rounded capitalize ${style.textAlign === align ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}
            data-testid={`typo-align-${align}`}
          >
            {align === 'left' ? '⫷' : align === 'center' ? '⫿' : '⫸'}
          </button>
        ))}
      </div>

      {/* Shadow */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Shadow</label>
          <input
            type="checkbox"
            checked={style.shadow !== null}
            onChange={(e) => {
              if (e.target.checked) {
                update({ shadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' } });
              } else {
                update({ shadow: null });
              }
            }}
            data-testid="typo-shadow-toggle"
          />
        </div>
        {style.shadow && (
          <div className="grid grid-cols-2 gap-2 pl-2">
            <div className="flex items-center gap-1">
              <label className="text-xs text-zinc-400 w-6">X</label>
              <input
                type="number"
                value={style.shadow.offsetX}
                onChange={(e) => update({ shadow: { ...style.shadow!, offsetX: Number(e.target.value) } })}
                className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none"
                data-testid="typo-shadow-x"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-zinc-400 w-6">Y</label>
              <input
                type="number"
                value={style.shadow.offsetY}
                onChange={(e) => update({ shadow: { ...style.shadow!, offsetY: Number(e.target.value) } })}
                className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none"
                data-testid="typo-shadow-y"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-zinc-400 w-6">Blur</label>
              <input
                type="number"
                value={style.shadow.blur}
                onChange={(e) => update({ shadow: { ...style.shadow!, blur: Number(e.target.value) } })}
                min={0}
                className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none"
                data-testid="typo-shadow-blur"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-zinc-400 w-6">Col</label>
              <input
                type="color"
                value={style.shadow.color}
                onChange={(e) => update({ shadow: { ...style.shadow!, color: e.target.value } })}
                className="w-6 h-5 bg-transparent border-0 cursor-pointer"
                data-testid="typo-shadow-color"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
