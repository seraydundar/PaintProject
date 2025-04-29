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
  const canvasRef    = useRef(null);
  const svgInputRef  = useRef(null);
  const pngInputRef  = useRef(null);
  const canvas       = useRef(null);
  const measurePts   = useRef([]);

  // 1) Init & resize
  useEffect(() => {
    const c = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      selection: true
    });
    canvas.current = c;

    const onResize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      c.setDimensions({ width: w, height: h });
      c.renderAll();
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      c.dispose();
    };
  }, []);

  // 2) Clear handler
  useEffect(() => {
    const handler = () => {
      const c = canvas.current;
      if (!c) return;
      const sel = c.getActiveObjects();
      if (sel.length) {
        sel.forEach(o => c.remove(o));
        c.discardActiveObject();
      } else {
        c.clear();
        c.backgroundColor = '#ffffff';
      }
      c.renderAll();
    };
    window.addEventListener('canvas:clear', handler);
    return () => window.removeEventListener('canvas:clear', handler);
  }, []);

  // 3) Export & import triggers (SVG & PNG only)
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    const saveSVG = () => {
      const blob = new Blob([c.toSVG()], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'canvas.svg'; a.click();
      URL.revokeObjectURL(url);
    };
    const savePNG = () => {
      const dataURL = c.toDataURL({ format: 'png' });
      const a = document.createElement('a');
      a.href = dataURL; a.download = 'canvas.png'; a.click();
    };
    const triggerSVG = () => svgInputRef.current?.click();
    const triggerPNG = () => pngInputRef.current?.click();

    window.addEventListener('canvas:export-svg', saveSVG);
    window.addEventListener('canvas:export-png', savePNG);
    window.addEventListener('canvas:import-svg', triggerSVG);
    window.addEventListener('canvas:import-png', triggerPNG);

    return () => {
      window.removeEventListener('canvas:export-svg', saveSVG);
      window.removeEventListener('canvas:export-png', savePNG);
      window.removeEventListener('canvas:import-svg', triggerSVG);
      window.removeEventListener('canvas:import-png', triggerPNG);
    };
  }, []);

  // 4) Tool logic
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    c.isDrawingMode = false;
    ['mouse:down', 'mouse:move', 'mouse:up'].forEach(evt => c.off(evt));
    c.selection     = activeTool === 'select';
    c.defaultCursor = 'default';
    measurePts.current = [];

    const { color, strokeWidth, brushWidth, sides, fontSize, fill, scale, unit } = toolOptions;

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
          line = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: color, strokeWidth, selectable: false });
          c.add(line);
        });
        c.on('mouse:move', e => {
          if (!line) return;
          const p = c.getPointer(e.e);
          line.set({ x2: p.x, y2: p.y });
          c.renderAll();
        });
        c.on('mouse:up', () => {
          line?.setCoords();
          line = null;
        });
        break;
      }
      case 'rect': {
        let rect;
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          rect = new fabric.Rect({ left: p.x, top: p.y, width: 0, height: 0, fill: 'transparent', stroke: color, strokeWidth, selectable: false });
          c.add(rect);
        });
        c.on('mouse:move', e => {
          if (!rect) return;
          const p = c.getPointer(e.e);
          rect.set({ left: Math.min(p.x, rect.left), top: Math.min(p.y, rect.top), width: Math.abs(p.x - rect.left), height: Math.abs(p.y - rect.top) });
          c.renderAll();
        });
        c.on('mouse:up', () => {
          rect?.setCoords();
          rect.set({ selectable: true });
          rect = null;
        });
        break;
      }
      case 'ellipse': {
        let ellipse;
        c.on('mouse:down', e => {
          const p = c.getPointer(e.e);
          ellipse = new fabric.Ellipse({ left: p.x, top: p.y, rx: 0, ry: 0, originX: 'center', originY: 'center', fill: 'transparent', stroke: color, strokeWidth, selectable: false });
          c.add(ellipse);
        });
        c.on('mouse:move', e => {
          if (!ellipse) return;
          const p = c.getPointer(e.e);
          const rx = Math.abs(p.x - ellipse.left);
          const ry = Math.abs(p.y - ellipse.top);
          ellipse.set({ rx, ry });
          c.renderAll();
        });
        c.on('mouse:up', () => {
          ellipse?.setCoords();
          ellipse.set({ selectable: true });
          ellipse = null;
        });
        break;
      }
      case 'polygon': {
        let poly = null;
        let start = null;
        c.defaultCursor = 'crosshair';
        c.on('mouse:down', e => {
          start = c.getPointer(e.e);
          const pts = getPolygonPoints(start.x, start.y, 0, sides);
          poly = new fabric.Polygon(pts, { fill: 'transparent', stroke: color, strokeWidth, selectable: false });
          c.add(poly);
        });
        c.on('mouse:move', e => {
          if (!poly) return;
          const p = c.getPointer(e.e);
          const r = Math.hypot(p.x - start.x, p.y - start.y);
          const pts = getPolygonPoints(start.x, start.y, r, sides);
          poly.set({ points: pts });
          c.renderAll();
        });
        c.on('mouse:up', () => {
          if (!poly) return;
          poly.set({ selectable: true });
          poly.setCoords();
          poly = null;
        });
        break;
      }
      case 'text': {
        c.defaultCursor = 'text';
        c.on('mouse:down', opt => {
          const evt = opt.e;
          const pointer = c.getPointer(evt);
          const target = opt.target;
          if (target && target.isType && target.isType('i-text')) {
            c.setActiveObject(target);
            target.enterEditing();
            target.selectAll();
          } else {
            const txt = new fabric.IText('Text', { left: pointer.x, top: pointer.y, fill: color, fontSize, selectable: true });
            c.add(txt);
            c.setActiveObject(txt);
            txt.enterEditing();
            txt.selectAll();
          }
        });
        break;
      }
      case 'fill': {
        c.defaultCursor = 'pointer';
        c.on('mouse:down', e => {
          const t = c.findTarget(e.e, true);
          if (t) {
            t.set('fill', fill);
            c.requestRenderAll();
          }
        });
        break;
      }
      case 'measure': {
        c.defaultCursor = 'crosshair';
        let start = null;
        let previewLine = null;
        let previewText = null;

        c.on('mouse:down', e => {
          start = c.getPointer(e.e);
          previewLine = new fabric.Line([start.x, start.y, start.x, start.y], { stroke: color, strokeWidth, selectable: false, evented: false });
          previewText = new fabric.Text('0 px', { left: start.x, top: start.y - 20, fill: color, fontSize: 14, selectable: false, evented: false });
          c.add(previewLine);
          c.add(previewText);
        });
        c.on('mouse:move', e => {
          if (!start || !previewLine) return;
          const p = c.getPointer(e.e);
          previewLine.set({ x2: p.x, y2: p.y });
          const dx = p.x - start.x;
          const dy = p.y - start.y;
          const distPx = Math.hypot(dx, dy);
          let label = `${distPx.toFixed(0)} px`;
          if (scale > 0 && unit) label += ` (${(distPx / scale).toFixed(2)} ${unit})`;
          previewText.set({ text: label, left: (start.x + p.x) / 2, top: ((start.y + p.y) / 2) - 20 });
          c.renderAll();
        });
        c.on('mouse:up', () => {
          if (!previewLine) return;
          previewLine.set({ selectable: true, evented: true });
          previewLine.setCoords();
          previewText.set({ selectable: true, evented: true });
          start = null;
          previewLine = null;
          previewText = null;
        });
        break;
      }
      default:
        break;
    }

    return () => {
      ['mouse:down', 'mouse:move', 'mouse:up'].forEach(evt => c.off(evt));
      c.isDrawingMode = false;
      c.defaultCursor = 'default';
    };
  }, [activeTool, toolOptions]);

  // 5) Render + hidden inputs
  return (
    <div ref={containerRef} style={{ width: '100vw', height: 'calc(100vh - 60px)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* SVG Import */}
      <input
        type="file"
        accept=".svg"
        ref={svgInputRef}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ({ target }) => {
            fabric.loadSVGFromString(target.result, (objects, options) => {
              const c = canvas.current;
              c.clear();
              const svgGroup = fabric.util.groupSVGElements(objects, options);
              svgGroup.set({ left: c.getWidth() / 2, top: c.getHeight() / 2, originX: 'center', originY: 'center' });
              c.add(svgGroup).setActiveObject(svgGroup);
              c.renderAll();
            });
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
      />

      {/* PNG Import */}
      <input
        type="file"
        accept="image/png"
        ref={pngInputRef}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          fabric.Image.fromURL(url, img => {
            const c = canvas.current;
            c.clear();
            const cw = c.getWidth(), ch = c.getHeight();
            const scale = Math.min(cw / img.width, ch / img.height, 1);
            img.set({ left: cw / 2, top: ch / 2, originX: 'center', originY: 'center', scaleX: scale, scaleY: scale });
            c.add(img).setActiveObject(img);
            c.renderAll();
            URL.revokeObjectURL(url);
          });
          e.target.value = '';
        }}
      />
    </div>
  );
}
