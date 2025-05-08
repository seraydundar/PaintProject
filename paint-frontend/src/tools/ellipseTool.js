// src/tools/ellipseTool.js
import { Ellipse } from 'fabric';

/**
 * Elips (oval) aracını başlatır.
 */
export function initEllipseTool(canvas, options) {
  const { color, strokeWidth = 1, fillColor = 'transparent' } = options;
  let ellipse = null;
  let start = null;

  const onMouseDown = e => {
    start = canvas.getPointer(e.e);
    ellipse = new Ellipse({
      left:   start.x,
      top:    start.y,
      rx:     0,
      ry:     0,
      stroke: color,
      strokeWidth,
      fill:    fillColor,
      originX: 'center',
      originY: 'center'
    });
    canvas.add(ellipse);
  };
  const onMouseMove = e => {
    if (!ellipse) return;
    const pointer = canvas.getPointer(e.e);
    ellipse.set({
      rx:   Math.abs(pointer.x - start.x) / 2,
      ry:   Math.abs(pointer.y - start.y) / 2,
      left: (pointer.x + start.x) / 2,
      top:  (pointer.y + start.y) / 2
    });
    canvas.renderAll();
  };
  const onMouseUp = () => {
    ellipse = null;
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
