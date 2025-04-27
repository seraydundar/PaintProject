// src/components/Canvas.jsx
import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const getPolygonPoints = (cx, cy, radius, sides) => {
  const angle = (2 * Math.PI) / sides;
  return Array.from({ length: sides }).map((_, i) => ({
    x: cx + radius * Math.cos(i * angle),
    y: cy + radius * Math.sin(i * angle),
  }));
};

export default function Canvas({ activeTool, toolOptions }) {
  const containerRef = useRef(null);
  const canvasRef     = useRef(null);
  const canvas        = useRef(null);

  // 1) Init + resize
  useEffect(() => {
    const c = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      selection: activeTool === 'select',
    });
    canvas.current = c;

    const resize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      c.setDimensions({ width: w, height: h });
      c.renderAll();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      c.dispose();
    };
  }, []);

  // 2) Clear handler
  useEffect(() => {
    const clearHandler = () => {
      const c = canvas.current;
      if (!c) return;
      const actives = c.getActiveObjects();
      if (actives.length) {
        actives.forEach(o => c.remove(o));
        c.discardActiveObject();
      } else {
        c.clear();
        c.backgroundColor = '#ffffff';
      }
      c.requestRenderAll();
    };
    window.addEventListener('canvas:clear', clearHandler);
    return () => window.removeEventListener('canvas:clear', clearHandler);
  }, []);

  // 3) Font size canlı güncelleme (text seçili ve edit halindeyse)
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (activeTool === 'text') {
      const obj = c.getActiveObject();
      if (obj?.type === 'i-text') {
        obj.set({ fontSize: toolOptions.fontSize });
        c.requestRenderAll();
      }
    }
  }, [toolOptions.fontSize, activeTool]);

  // 4) Araç logic
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    // Reset
    c.isDrawingMode = false;
    ['mouse:down','mouse:move','mouse:up'].forEach(evt => c.off(evt));
    c.selection     = activeTool === 'select';
    c.defaultCursor = 'default';

    const { color, strokeWidth, brushWidth, sides, fontSize, fill } = toolOptions;

    switch (activeTool) {

      case 'brush': {
        c.isDrawingMode = true;
        const brush = new fabric.PencilBrush(c);
        brush.color = color;
        brush.width = brushWidth;
        c.freeDrawingBrush = brush;
        break;
      }

      case 'line': {
        let line;
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          line = new fabric.Line([p.x,p.y,p.x,p.y], {
            stroke: color, strokeWidth, selectable: false
          });
          c.add(line);
        });
        c.on('mouse:move', e => {
          if (!line) return;
          const p = c.getPointer(e.e);
          line.set({ x2: p.x, y2: p.y });
          c.requestRenderAll();
        });
        c.on('mouse:up', () => {
          if (line) line.setCoords();
          line = null;
        });
        break;
      }

      case 'rect': {
        let rect;
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          rect = new fabric.Rect({
            left: p.x, top: p.y,
            width: 0, height: 0,
            fill: 'transparent',           // transparan
            stroke: color,
            strokeWidth,
            selectable: false
          });
          c.add(rect);
        });
        c.on('mouse:move', e => {
          if (!rect) return;
          const p = c.getPointer(e.e);
          rect.set({
            width: p.x - rect.left,
            height: p.y - rect.top
          });
          c.requestRenderAll();
        });
        c.on('mouse:up', () => {
          if (rect) rect.setCoords();
          rect = null;
        });
        break;
      }

      case 'ellipse': {
        let ellipse;
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          ellipse = new fabric.Ellipse({
            left: p.x, top: p.y,
            rx: 0, ry: 0,
            originX: 'left', originY: 'top',
            fill: 'transparent',           // transparan
            stroke: color,
            strokeWidth,
            selectable: false
          });
          c.add(ellipse);
        });
        c.on('mouse:move', e => {
          if (!ellipse) return;
          const p = c.getPointer(e.e);
          ellipse.set({
            rx: Math.abs(p.x - ellipse.left) / 2,
            ry: Math.abs(p.y - ellipse.top) / 2
          });
          c.requestRenderAll();
        });
        c.on('mouse:up', () => {
          if (ellipse) ellipse.setCoords();
          ellipse = null;
        });
        break;
      }

      case 'polygon': {
        let clickCount = 0;
        let center = { x: 0, y: 0 };
        c.defaultCursor = 'crosshair';
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          if (clickCount === 0) {
            center = { ...p };
            clickCount = 1;
          } else {
            const dx = p.x - center.x, dy = p.y - center.y;
            const radius = Math.hypot(dx, dy);
            const points = getPolygonPoints(center.x, center.y, radius, sides);
            const poly = new fabric.Polygon(points, {
              fill: 'transparent',         // transparan
              stroke: color,
              strokeWidth
            });
            c.add(poly);
            poly.setCoords();
            c.renderAll();
            clickCount = 0;
          }
        });
        break;
      }

      case 'text': {
        c.defaultCursor = 'text';
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          const txt = new fabric.IText('Text', {
            left: p.x, top: p.y,
            fill: color,
            fontSize,
            selectable: true
          });
          c.add(txt);
          c.setActiveObject(txt);
          txt.enterEditing();
          txt.selectAll();
        });
        break;
      }

      case 'fill': {
        c.defaultCursor = 'pointer';
        c.on('mouse:down', e => {
          const target = c.findTarget(e.e, true);
          if (target && target.set) {
            target.set('fill', fill);
            c.requestRenderAll();
          }
        });
        break;
      }

      default:
        break;
    }

    return () => {
      ['mouse:down','mouse:move','mouse:up'].forEach(evt => c.off(evt));
      c.isDrawingMode = false;
      c.defaultCursor = 'default';
    };
  }, [activeTool, toolOptions]);

  // 5) Render
  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: 'calc(100vh - 60px)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display:'block', width:'100%', height:'100%' }}
      />
    </div>
  );
}
