import { useCallback, useRef } from 'react';
import { FabricImage, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';

export function useImageTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg';
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;

    const handleChange = () => {
      const file = input.files?.[0];
      if (!file || !canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const imgEl = new Image();
        imgEl.onload = () => {
          const fabricImg = new FabricImage(imgEl, {
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            originX: 'center',
            originY: 'center',
          });

          // Scale down if image is larger than canvas
          const maxScale = Math.min(
            (canvas.width! * 0.8) / imgEl.width,
            (canvas.height! * 0.8) / imgEl.height,
            1
          );
          if (maxScale < 1) {
            fabricImg.scale(maxScale);
          }

          // Lock aspect ratio by default
          if (typeof fabricImg.setControlsVisibility === 'function') {
            fabricImg.setControlsVisibility({ mb: false, mt: false, ml: false, mr: false });
          }
          (fabricImg as any).lockUniScaling = true;

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.renderAll();

          const fileName = file.name.replace(/\.[^/.]+$/, '');
          const layerId = addLayer({
            type: 'image',
            name: fileName || 'Image',
            fabricObject: fabricImg,
          });
          selectLayer(layerId);
        };
        imgEl.src = dataUrl;
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      input.value = '';
      input.removeEventListener('change', handleChange);
    };

    input.addEventListener('change', handleChange);
    input.click();
  }, [canvas, addLayer, selectLayer]);

  return { openFilePicker, fileInputRef };
}
