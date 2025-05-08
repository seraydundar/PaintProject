// src/tools/brushTool.js
import { PencilBrush } from 'fabric';

/**
 * Serbest çizim (brush) aracını başlatır.
 * toolOptions.brushWidth kullanılarak kalınlık ayarlanır.
 */
export function initBrushTool(canvas, options) {
  const { color, brushWidth = 1 } = options;

  // Çizim modunu aç ve yeni bir PencilBrush örneği ata
  canvas.isDrawingMode = true;
  const brush = new PencilBrush(canvas);

  // Fırça rengini ve kalınlığını ayarla
  brush.color = color;
  brush.width = brushWidth;
  canvas.freeDrawingBrush = brush;

  // Cleanup: drawing modunu kapat
  return () => {
    canvas.isDrawingMode = false;
  };
}
