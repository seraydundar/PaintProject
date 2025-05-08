// src/tools/rectTool.js
import { Rect } from 'fabric';

/**
 * Dikdörtgen (rectangle) aracını başlatır.
 */
export function initRectTool(canvas, options) {
  const { color, strokeWidth = 1, fillColor = 'transparent' } = options;
  let rect = null;
  let start = null;

  const onMouseDown = e => {
    start = canvas.getPointer(e.e);
    rect = new Rect({
      left:   start.x,
      top:    start.y,
      width:  0,
      height: 0,
      stroke: color,
      strokeWidth,
      fill:    fillColor,
    });
    canvas.add(rect);
  };
  const onMouseMove = e => {
    if (!rect) return;
    const pointer = canvas.getPointer(e.e);
    rect.set({
      width:  Math.abs(pointer.x - start.x),
      height: Math.abs(pointer.y - start.y),
      left:   Math.min(pointer.x, start.x),
      top:    Math.min(pointer.y, start.y)
    });
    canvas.renderAll();
  };
  const onMouseUp = () => {
    rect = null;
    start = null;
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
