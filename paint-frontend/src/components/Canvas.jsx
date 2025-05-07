// src/components/Canvas.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const DEFAULT_DPI = 96;
const mmPerInch = 25.4;
const getDPI = (toolOptions) => {
  // Eğer toolOptions props’u ile geliyorsa kullan, yoksa DEFAULT_DPI
  return (toolOptions && toolOptions.dpi) ? toolOptions.dpi : DEFAULT_DPI;
};



const getPolygonPoints = (cx, cy, radius, sides) => {
  const angle = (2 * Math.PI) / sides;
  return Array.from({ length: sides }).map((_, i) => ({
    x: cx + radius * Math.cos(i * angle),
    y: cy + radius * Math.sin(i * angle),
  }));
};

export default function Canvas({ activeTool, onZoomChange, width, height, tool, toolOptions = {}, onChange }) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const svgInputRef  = useRef(null);
  const pngInputRef  = useRef(null);
  const canvas       = useRef(null);
  const measurePts   = useRef([]);
  const [zoom, setZoom] = useState(1);

  const [shapes, setShapes] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

    // layers state  
  const [layersVisible, setLayersVisible] = useState(true);

  const [layers, setLayers] = useState([]);              // [{ index, name }]
  const [selectedLayer, setSelectedLayer] = useState(null);
  
  // helper: rebuild layer list from canvas objects  
  const updateLayers = () => {
    if (!canvas.current) return;
    const objs = canvas.current.getObjects();
    setLayers(objs.map((o, i) => ({ index: i, name: o.type })));
  };

// bringForward
const bringForward = idx => {
  const c = canvas.current;
  const objs = c._objects;            // doğrudan iç diziye erişim
  if (idx < objs.length - 1) {
    const [obj] = objs.splice(idx, 1);  // mevcut konumundan çıkar
    objs.splice(idx + 1, 0, obj);       // bir üst katmana ekle
    c.renderAll();
    updateLayers();
  }
};

// sendBackward
const sendBackward = idx => {
  const c = canvas.current;
  const objs = c._objects;
  if (idx > 0) {
    const [obj] = objs.splice(idx, 1);  // mevcut konumundan çıkar
    objs.splice(idx - 1, 0, obj);       // bir alt katmana ekle
    c.renderAll();
    updateLayers();
  }
};

const deleteLayer = idx => {
  const c = canvas.current;
  const obj = c.getObjects()[idx];
  if (!obj) return;
  c.remove(obj);
  c.renderAll();
  updateLayers();
};




  // select a layer on the canvas  
  const selectLayer = idx => {
    const obj = canvas.current.getObjects()[idx];
    if (!obj) return;
    canvas.current.setActiveObject(obj);
    canvas.current.renderAll();
  };


// PNG yükleme handler - birden fazla dosya desteklenir
function handlePngUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const fImg = new fabric.Image(imgEl, {
          left:       canvas.current.getWidth()  / 2,
          top:        canvas.current.getHeight() / 2,
          originX:    'center',
          originY:    'center',
        });
        // Taşınabilir ve ölçeklenebilir olsun
        fImg.set({
          selectable: true,
          evented:    true,
        });
        canvas.current.add(fImg);
        canvas.current.setActiveObject(fImg);
        canvas.current.renderAll();
      };
      imgEl.src = target.result;
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

// SVG yükleme handler - birden fazla dosya desteklenir
function handleSvgUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imgEl = new Image();
      imgEl.onload = () => {
        const fImg = new fabric.Image(imgEl, {
          left:       canvas.current.getWidth()  / 2,
          top:        canvas.current.getHeight() / 2,
          originX:    'center',
          originY:    'center',
        });
        // Taşınabilir ve ölçeklenebilir olsun
        fImg.set({
          selectable: true,
          evented:    true,
        });
        canvas.current.add(fImg);
        canvas.current.setActiveObject(fImg);
        canvas.current.renderAll();
      };
      imgEl.src = target.result;
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}


useEffect(() => {
  const c = new fabric.Canvas(canvasRef.current, {
    backgroundColor: '#ffffff',
    selection: true,
  });
  canvas.current = c;
  setZoom(c.getZoom());
  onZoomChange?.(c.getZoom());

  updateLayers();

  // resize handler  
  const onResize = () => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    c.setDimensions({ width: w, height: h });
    c.renderAll();
  };
  onResize();
  window.addEventListener('resize', onResize);

  // wheel zoom (%50–%200)  
  const onWheel = opt => {
    const delta = opt.e.deltaY;
    let newZoom = c.getZoom() * (0.999 ** delta);
    newZoom = Math.max(0.5, Math.min(newZoom, 2));
    c.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  };
  c.on('mouse:wheel', onWheel);

  // keep layers up-to-date  
  c.on('object:added',    updateLayers);
  c.on('object:removed',  updateLayers);
  c.on('object:modified', updateLayers);

  // ─── FabricJS polygon köşe düzenleme kontrolleri ────────────────────
  function enablePolygonEditing(poly) {
    // cache kapalı; editable poligonlar için önemli
    poly.set({ objectCaching: false });

    // her verteks için kontrol tanımı
    const controls = poly.points.reduce((acc, pt, idx) => {
      acc[`p${idx}`] = new fabric.Control({
        // köşe konumunu hesapla
        positionHandler: (dim, finalMatrix, obj) => {
          const point = obj.points[idx];
          return fabric.util.transformPoint(
            { x: point.x, y: point.y },
            obj.calcTransformMatrix()
          );
        },
        // sürükleme işlemi
        actionHandler: (eventData, transform) => {
          const polygon = transform.target;
          const pointer = polygon.canvas.getPointer(eventData.e);
          const newLocal = fabric.util.transformPoint(
            { x: pointer.x, y: pointer.y },
            fabric.util.invertTransform(polygon.calcTransformMatrix())
          );
          polygon.points[idx] = { x: newLocal.x, y: newLocal.y };
          polygon.dirty = true;
          return true;
        },
        cursorStyleHandler: () => 'move',
        cornerSize:     10,       // tıklanabilir alan
        withConnection: false,    // köşe-şekil çizgisini kapat
        render:         () => {}, // hiçbir şey çizilmesin
        actionName:    'modifyPolygon',
      });
      return acc;
    }, {});

    poly.controls = controls;
    c.requestRenderAll();
  }

  // mevcut canvas’taki polygon’lara uygula
  c.getObjects()
   .filter(o => o.type === 'polygon')
   .forEach(poly => enablePolygonEditing(poly));

  // yeni eklenen polygon’lara uygula
  const onObjectAdded = e => {
    if (e.target.type === 'polygon') {
      enablePolygonEditing(e.target);
    }
  };
  c.on('object:added', onObjectAdded);
  // ───────────────────────────────────────────────────────────────────────

  return () => {
    window.removeEventListener('resize', onResize);
    c.off('mouse:wheel', onWheel);
    c.off('object:added',    updateLayers);
    c.off('object:removed',  updateLayers);
    c.off('object:modified', updateLayers);
    c.off('object:added',    onObjectAdded);
    c.dispose();
  };
}, [onZoomChange]);


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
  
    // Ortak ayarlar
    c.selection      = activeTool === 'select';
    c.skipTargetFind = activeTool === 'measure';
    c.defaultCursor  = 'default';
    c.isDrawingMode  = false;
    ['mouse:down', 'mouse:move', 'mouse:up'].forEach(evt => c.off(evt));
    measurePts.current = [];
  
    // ToolOptions’tan gelen değerler
    const { color, strokeWidth, brushWidth, sides, fontSize, fill, scale, unit } = toolOptions;
  
    // Ölçüm için DPI ve mm→px dönüşümü
    const dpi      = getDPI(toolOptions);
    const targetMm = toolOptions.measureLength || 0;
    const targetPx = targetMm > 0 ? (targetMm / mmPerInch) * dpi : 0;
  
    // Araçlara göre logic
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
        const absolutePoints = [];
        const tempMarkers = [];
        const tempLines = [];
        const controls = [];
        const handleRadius = 6;
        const finishThreshold = handleRadius;
        c.defaultCursor = 'crosshair';
      
        const onMouseDown = e => {
          const pointer = c.getPointer(e.e);
      
          // Polygonu kapatma tıklaması?
          if (absolutePoints.length >= 3) {
            const first = absolutePoints[0];
            if (Math.hypot(pointer.x - first.x, pointer.y - first.y) <= finishThreshold) {
              // Geçicileri temizle
              tempMarkers.forEach(m => c.remove(m));
              tempLines.forEach(l => c.remove(l));
      
              // Bounding box hesapla
              const xs = absolutePoints.map(p => p.x);
              const ys = absolutePoints.map(p => p.y);
              const minX = Math.min(...xs);
              const minY = Math.min(...ys);
      
              // Relative noktalara çevir
              const relPoints = absolutePoints.map(p => ({
                x: p.x - minX,
                y: p.y - minY
              }));
      
              // Poligonu ekle
              const polygon = new fabric.Polygon(relPoints, {
                left:       minX,
                top:        minY,
                fill:       'transparent',
                stroke:     color,
                strokeWidth,
                selectable: true
              });
              c.add(polygon);
              polygon._calcDimensions();
              polygon.setCoords();
      
              // Kontrol dairelerini oluştur
              relPoints.forEach((pt, idx) => {
                const ctrl = new fabric.Circle({
                  left:        minX + pt.x,
                  top:         minY + pt.y,
                  radius:      handleRadius,
                  fill:        'white',
                  stroke:      color,
                  strokeWidth: 1,
                  originX:     'center',
                  originY:     'center',
                  hasBorders:  false,
                  hasControls: false,
                  lockRotation:true,
                  lockScalingX:true,
                  lockScalingY:true,
                  evented:     true,
                  selectable:  true
                });
      
                // Sürükleme olayında: sadece poligonun noktalarını güncelle ve
                // tüm kontrol dairelerini yeni poligon köşelerine tekrar yerleştir
                ctrl.on('moving', () => {
                  // 1) Yeni absolute nokta
                  const newX = ctrl.left;
                  const newY = ctrl.top;
                  // 2) Relatif diziye yaz
                  relPoints[idx] = {
                    x: newX - polygon.left,
                    y: newY - polygon.top
                  };
                  // 3) Poligonu güncelle
                  polygon.set({ points: relPoints });
                  polygon._calcDimensions();
                  polygon.setCoords();
      
                  // 4) Tüm kontrolleri yeniden konumlandır
                  controls.forEach((cCtrl, i) => {
                    const p = relPoints[i];
                    cCtrl.set({
                      left: polygon.left + p.x,
                      top:  polygon.top  + p.y
                    });
                    cCtrl.setCoords();
                  });
      
                  c.renderAll();
                });
      
                controls.push(ctrl);
                c.add(ctrl);
              });
      
              // Listener'ı kaldır, yeni tıklamaya izin verme
              c.off('mouse:down', onMouseDown);
              return;
            }
          }
      
          // Yeni nokta ekleme
          const marker = new fabric.Circle({
            left:        pointer.x,
            top:         pointer.y,
            radius:      handleRadius,
            fill:        'white',
            stroke:      color,
            strokeWidth: 1,
            originX:     'center',
            originY:     'center',
            selectable:  false,
            evented:     false
          });
          c.add(marker);
          tempMarkers.push(marker);
          absolutePoints.push({ x: pointer.x, y: pointer.y });
      
          if (absolutePoints.length > 1) {
            const prev = absolutePoints[absolutePoints.length - 2];
            const line = new fabric.Line([prev.x, prev.y, pointer.x, pointer.y], {
              stroke:      color,
              strokeWidth,
              selectable:  false,
              evented:     false
            });
            c.add(line);
            tempLines.push(line);
          }
        };
      
        c.on('mouse:down', onMouseDown);
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
            c.renderAll();
          }
        });
        break;
      }
      case 'measure': {
        // Measure başlıyor
        let start = null, previewLine = null, previewText = null, measureDone = false;
  
        const onMouseDown = e => {
          if (measureDone) return;
          start = c.getPointer(e.e);
          previewLine = new fabric.Line(
            [start.x, start.y, start.x, start.y],
            { stroke: color, strokeWidth, selectable: false, evented: false }
          );
          previewText = new fabric.Text(
            targetMm > 0 ? `${targetMm.toFixed(2)} mm` : '0.00 mm',
            { left: start.x, top: start.y - 20, fill: color, fontSize: 14, selectable: false, evented: false }
          );
          c.add(previewLine);
          c.add(previewText);
        };
  
        const onMouseMove = e => {
          if (!start || !previewLine) return;
          const p = c.getPointer(e.e);
          const dx = p.x - start.x, dy = p.y - start.y;
          let x2, y2, displayMm;
  
          if (targetPx) {
            const len = Math.hypot(dx, dy);
            if (len > 0) {
              const ux = dx / len, uy = dy / len;
              x2 = start.x + ux * targetPx;
              y2 = start.y + uy * targetPx;
            } else {
              x2 = start.x; y2 = start.y;
            }
            displayMm = targetMm;
          } else {
            x2 = p.x; y2 = p.y;
            displayMm = (Math.hypot(dx, dy) / dpi) * mmPerInch;
          }
  
          previewLine.set({ x2, y2 });
          previewText.set({
            text: `${displayMm.toFixed(2)} mm`,
            left: (start.x + x2) / 2,
            top: ((start.y + y2) / 2) - 20
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
    } // switch sonu
  
    // Enter tuşu: sabit uzunlukta measure çizgisi
    const onKeyDown = e => {
      if (activeTool === 'measure' && e.key === 'Enter' && targetPx > 0) {
        const startPt = { x: c.getWidth() / 2, y: c.getHeight() / 2 };
        const endPt   = { x: startPt.x + targetPx, y: startPt.y };
  
        c.add(new fabric.Line(
          [startPt.x, startPt.y, endPt.x, endPt.y],
          { stroke: color, strokeWidth, selectable: true }
        ));
        c.add(new fabric.Text(
          `${targetMm.toFixed(2)} mm`,
          {
            left:  (startPt.x + endPt.x) / 2,
            top:   startPt.y - 20,
            fill:  color,
            fontSize: 14,
            selectable: false,
            evented: false
          }
        ));
        c.renderAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
  
    // Tek cleanup return’ü
    return () => {
      c.off('mouse:down');
      c.off('mouse:move');
      c.off('mouse:up');
      window.removeEventListener('keydown', onKeyDown);
      c.defaultCursor  = 'default';
      c.skipTargetFind = false;
    };
  }, [
    activeTool,
    toolOptions.measureLength,
    toolOptions.dpi
  ]);
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

      {/* gizli import input’lar */}
      <input
        type="file"
        accept=".svg"
        ref={svgInputRef}
        style={{ display: 'none' }}
        onChange={handleSvgUpload}
      />
      <input
        type="file"
        accept="image/*"
        ref={pngInputRef}
        style={{ display: 'none' }}
        onChange={handlePngUpload}
      />

      {/* zoom göstergesi (alt sağdaki artık opsiyonel istersen kaldırabilirsiniz) */}
      <div
        className="zoom-indicator"
        onClick={() => {
          canvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
          canvas.current.setZoom(1);
          setZoom(1);
          onZoomChange?.(1);
        }}
      >
        Zoom: {Math.round(zoom * 100)}%
      </div>

      {/* —— Layer Panel —— */}
      <div className={`layers-panel ${layersVisible ? 'open' : ''}`}>
  <div
    className="layers-panel-header"
    onClick={() => setLayersVisible(!layersVisible)}
  >
    Layers {layersVisible ? '▼' : '▲'}
  </div>

  <div className="layers-panel-content">
    <ul>
      {layers.map(layer => (
        <li
          key={layer.index}
          className={selectedLayer === layer.index ? 'selected' : ''}
        >
          <span
            onClick={() => {
              selectLayer(layer.index);
              setSelectedLayer(layer.index);
            }}
          >
            {layer.name} #{layer.index}
          </span>
          <button onClick={() => bringForward(layer.index)}>↑</button>
          <button onClick={() => sendBackward(layer.index)}>↓</button>
          <button onClick={() => deleteLayer(layer.index)}>🗑️</button>
        </li>
      ))}
    </ul>
  </div>
</div>


  
  



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
    
  
  /* Yeni: Zoom gösterge */
  <div
        className="zoom-indicator"
        onClick={() => {
          canvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
          canvas.current.setZoom(1);
          setZoom(1);
          onZoomChange?.(1);
        }}
      >
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}