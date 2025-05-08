// src/tools/lineTool.js
import { Line } from 'fabric';

/**
 * Düz çizgi aracını başlatır.
 */
export function initLineTool(canvas, options) {
  const { color, strokeWidth = 1 } = options;
  let line = null;

  const onMouseDown = e => {
    const { x, y } = canvas.getPointer(e.e);
    line = new Line([x, y, x, y], { stroke: color, strokeWidth });
    canvas.add(line);
  };
  const onMouseMove = e => {
    if (!line) return;
    const { x, y } = canvas.getPointer(e.e);
    line.set({ x2: x, y2: y });
    canvas.renderAll();
  };
  const onMouseUp = () => {
    line = null;
  };

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);

  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('mouse:move', onMouseMove);
    canvas.off('mouse:up', onMouseUp);
  };
}
