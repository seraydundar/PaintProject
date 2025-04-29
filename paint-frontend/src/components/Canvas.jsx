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

  // PNG yükleme handler
  function handlePngUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const fImg = new fabric.Image(imgEl, {
          left:       canvas.current.getWidth() / 2,
          top:        canvas.current.getHeight() / 2,
          originX:    'center',
          originY:    'center',
          selectable: true,
          evented:    true
        });
        canvas.current.add(fImg).setActiveObject(fImg);
        canvas.current.renderAll();
      };
      imgEl.src = target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // SVG yükleme handler
  function handleSvgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const fImg = new fabric.Image(imgEl, {
          left:       canvas.current.getWidth() / 2,
          top:        canvas.current.getHeight() / 2,
          originX:    'center',
          originY:    'center',
          selectable: true,
          evented:    true
        });
        canvas.current.add(fImg).setActiveObject(fImg);
        canvas.current.renderAll();
      };
      imgEl.src = target.result;
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // 1) Canvas init & resize
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

  // 3) Export & import triggers
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

  // 4) Tool logic (brush, line, rect, ellipse, polygon, text, fill, measure)
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;

    // Ölçüm modu sırasında şekil taşımayı devre dışı bırak
    c.selection      = activeTool === 'select';
    c.skipTargetFind = activeTool === 'measure';
    c.defaultCursor  = 'default';
    c.isDrawingMode  = false;
    ['mouse:down', 'mouse:move', 'mouse:up'].forEach(evt => c.off(evt));
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
          line = new fabric.Line([p.x, p.y, p.x, p.y], {
            stroke: color,
            strokeWidth,
            selectable: false
          });
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
          rect = new fabric.Rect({
            left:       p.x,
            top:        p.y,
            width:      0,
            height:     0,
            fill:       'transparent',
            stroke:     color,
            strokeWidth,
            selectable: false
          });
          c.add(rect);
        });
        c.on('mouse:move', e => {
          if (!rect) return;
          const p = c.getPointer(e.e);
          rect.set({
            left:   Math.min(p.x, rect.left),
            top:    Math.min(p.y, rect.top),
            width:  Math.abs(p.x - rect.left),
            height: Math.abs(p.y - rect.top)
          });
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
          ellipse = new fabric.Ellipse({
            left:       p.x,
            top:        p.y,
            rx:         0,
            ry:         0,
            originX:    'center',
            originY:    'center',
            fill:       'transparent',
            stroke:     color,
            strokeWidth,
            selectable: false
          });
          c.add(ellipse);
        });
        c.on('mouse:move', e => {
          if (!ellipse) return;
          const p = c.getPointer(e.e);
          ellipse.set({
            rx: Math.abs(p.x - ellipse.left),
            ry: Math.abs(p.y - ellipse.top)
          });
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
        let poly = null, start = null;
        c.defaultCursor = 'crosshair';
        c.on('mouse:down', e => {
          start = c.getPointer(e.e);
          const pts = getPolygonPoints(start.x, start.y, 0, sides);
          poly = new fabric.Polygon(pts, {
            fill:       'transparent',
            stroke:     color,
            strokeWidth,
            selectable: false
          });
          c.add(poly);
        });
        c.on('mouse:move', e => {
          if (!poly) return;
          const p = c.getPointer(e.e);
          const r = Math.hypot(p.x - start.x, p.y - start.y);
          poly.set({ points: getPolygonPoints(start.x, start.y, r, sides) });
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
          const pointer = c.getPointer(opt.e);
          const target  = opt.target;
          if (target?.isType('i-text')) {
            c.setActiveObject(target);
            target.enterEditing();
            target.selectAll();
          } else {
            const txt = new fabric.IText('Text', {
              left:       pointer.x,
              top:        pointer.y,
              fill:       color,
              fontSize,
              selectable: true
            });
            c.add(txt).setActiveObject(txt);
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
            c.renderAll();
          }
        });
        break;
      }
      case 'measure': {
        c.defaultCursor = 'crosshair';
        let start = null, previewLine = null, previewText = null;
        let measureDone = false;

        const onMouseDown = e => {
          if (measureDone) return;
          start = c.getPointer(e.e);
          previewLine = new fabric.Line(
            [start.x, start.y, start.x, start.y],
            { stroke: color, strokeWidth, selectable: false, evented: false }
          );
          previewText = new fabric.Text('0 px', {
            left:       start.x,
            top:        start.y - 20,
            fill:       color,
            fontSize:   14,
            selectable: false,
            evented:    false
          });
          c.add(previewLine, previewText);
        };

        const onMouseMove = e => {
          if (!start || !previewLine) return;
          const p = c.getPointer(e.e);
          previewLine.set({ x2: p.x, y2: p.y });
          const dist = Math.hypot(p.x - start.x, p.y - start.y);
          let label = `${dist.toFixed(0)} px`;
          if (scale > 0 && unit) label += ` (${(dist/scale).toFixed(
            2
          )} ${unit})`;
          previewText.set({
            text:  label,
            left:  (start.x + p.x) / 2,
            top:   ((start.y + p.y) / 2) - 20
          });
          c.renderAll();
        };

        const onMouseUp = () => {
          if (!previewLine || measureDone) return;
          previewLine.set({ selectable: true, evented: true }).setCoords();
          previewText.set({ selectable: true, evented: true });
          measureDone = true;
          c.off('mouse:down', onMouseDown);
          c.off('mouse:move', onMouseMove);
          c.off('mouse:up', onMouseUp);
        };

        c.on('mouse:down', onMouseDown);
        c.on('mouse:move', onMouseMove);
        c.on('mouse:up', onMouseUp);
        break;
      }
      default:
        break;
    }

    return () => {
      ['mouse:down', 'mouse:move', 'mouse:up'].forEach(evt => c.off(evt));
      c.isDrawingMode = false;
      c.defaultCursor = 'default';
      c.skipTargetFind = false;
    };
  }, [activeTool, toolOptions]);

  // 5) Render + hidden inputs
  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: 'calc(100vh - 60px)', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* SVG Import */}
      <input
        type="file"
        accept=".svg"
        ref={svgInputRef}
        style={{ display: 'none' }}
        onChange={handleSvgUpload}
      />

      {/* PNG Import */}
      <input
        type="file"
        accept="image/*"
        ref={pngInputRef}
        style={{ display: 'none' }}
        onChange={handlePngUpload}
      />
    </div>
  );
}
