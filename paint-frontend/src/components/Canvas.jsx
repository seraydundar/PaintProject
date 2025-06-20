import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Line, Text, Group, Rect } from 'fabric'; 
import { initBrushTool }   from '../tools/brushTool';
import { initLineTool }    from '../tools/lineTool';
import { initRectTool }    from '../tools/rectTool';
import { initEllipseTool } from '../tools/ellipseTool';
import { initPolygonTool } from '../tools/polygonTool';
import { initTextTool }    from '../tools/textTool';
import { initFillTool }    from '../tools/fillTool';
import { initMeasureTool } from '../tools/measureTool';
import { getDPI,mmPerInch }          from '../utils/fabricUtils';
import { handlePngUpload, handleSvgUpload } from '../utils/importHandlers';
import HistogramAnalysis from './HistogramAnalysis';
//Filtreler
import applyGrayscale, { removeGrayscale } from '../filters/grayscaleFilter';
import applyBrightness, { removeBrightness } from '../filters/brightnessFilter';
import applyContrast, { removeContrast } from '../filters/contrastFilter';
import applyThreshold, { removeThreshold } from '../filters/thresholdFilter';
import applySharpen, { removeSharpen } from '../filters/sharpenFilter';
import applyBlur,       { removeBlur       } from '../filters/blurFilter';
import applyCrop,       { removeCrop       } from '../filters/cropFilter';




import { Canvas2dFilterBackend, setFilterBackend } from 'fabric';

// 2D filter backend’i global olarak ayarlıyoruz:
setFilterBackend(new Canvas2dFilterBackend());




export default function Canvas({ activeTool, toolOptions, onZoomChange }) {
  const containerRef   = useRef(null);
  const canvasRef      = useRef(null);
  const canvas         = useRef(null);
  const cleanupRef     = useRef(null);
  const svgInputRef    = useRef(null);
  const pngInputRef    = useRef(null);
  const cropRectRef = useRef(null);

  const [layersVisible, setLayersVisible]   = useState(true);
  const [layers, setLayers]                 = useState([]);
  const [selectedLayer, setSelectedLayer]   = useState(null);
  const [zoom, setZoom]                     = useState(1);

   const updateLayers = () => {
    const c = canvas.current;
    if (!c) return;
    const objs = c.getObjects();
    setLayers(objs.map((o, i) => ({ index: i, name: o.type, obj: o })));
  };

  const selectLayer = (idx) => {
  const c = canvas.current;
  const obj = c.getObjects()[idx];
  if (obj) {
    // En üste getirmek için önce kaldırıp yeniden ekle
    c.remove(obj);
    c.add(obj);
    c.setActiveObject(obj);
    c.renderAll();
    setSelectedLayer(idx);
    updateLayers();
  }
};


  const deleteLayer = (idx) => {
    const c = canvas.current;
    const obj = c.getObjects()[idx];
    if (obj) {
      c.remove(obj);
      c.renderAll();
      setSelectedLayer(null);
      updateLayers();
    }
  };

  // Reset zoom to 100%
  const resetZoom = () => {
    const c = canvas.current;
    if (!c) return;
    const center = {
      x: (c.getWidth() || toolOptions.width || 800) / 2,
      y: (c.getHeight() || toolOptions.height || 600) / 2
    };
    c.zoomToPoint(center, 1);
    setZoom(1);
    onZoomChange?.(1);
  };

  useEffect(() => {
  const applyFilterHandler = (e) => {
  const detail = e.detail;
  const key    = typeof detail === 'object' ? detail.key   : detail;
  const value  = typeof detail === 'object' ? detail.value : undefined;
  // canvas instance’ını al ve yoksa çık
  const c = canvas.current;
  if (!c) return;
  switch (key) {
    case 'grayscale':
      applyGrayscale(c);
      break;
    case 'brightness':
      applyBrightness(c, value);
      break;
    case 'contrast':
      applyContrast(c, value);
      break;
    case 'threshold':
      applyThreshold(c, value);
      break;
    case 'sharpen':
      applySharpen(c, value);
      break;
    case 'blur':
      applyBlur(c);
      break;
    case 'crop': {
  const c = canvas.current;
  if (!c) return;
  let cropRect = cropRectRef.current;

  // 1️⃣ Seçim kutusunu oluştur
  if (!cropRect) {
    // Önce bir resim objesi seçili mi?
    let img = c.getActiveObject();
    if (!img || img.type !== 'image') {
      img = c.getObjects().find(o => o.type === 'image');
      if (!img) {
        console.warn('Lütfen önce bir resim ekleyin veya seçin.');
        break;
      }
      c.setActiveObject(img);
    }

    // Görselin ekrandaki gerçek boyutlarını al
    const bounds = img.getBoundingRect(true);

    cropRect = new Rect({
      left:          bounds.left,
      top:           bounds.top,
      width:         bounds.width,
      height:        bounds.height,
      fill:          'rgba(0,0,0,0.1)',
      stroke:        'gray',
      strokeDashArray: [4, 4],
      selectable:    true,
      hasControls:   true,
      hasBorders:    true,
      lockRotation:  true,
      cornerColor:   'black',
      cornerSize:    6,
      transparentCorners: false,
      objectCaching: false,
    });

    c.add(cropRect);
    c.setActiveObject(cropRect);
    cropRectRef.current = cropRect;
    c.renderAll();

  // 2️⃣ Seçim onaylandı → gerçek kırpma
  } else {
    const b = cropRect.getBoundingRect(true);
    applyCrop(c, {
      left:   Math.round(b.left),
      top:    Math.round(b.top),
      width:  Math.round(b.width),
      height: Math.round(b.height)
    });
    c.remove(cropRect);
    cropRectRef.current = null;
    c.renderAll();
  }

  break;
}
 
   default:
      console.warn('Bilinmeyen filtre:', key);
  }
 };


  window.addEventListener('canvas:apply-filter', applyFilterHandler);

// — yeni: undo-filter listener’ı —
   const undoFilterHandler = (e) => {
   const detail = e.detail;
   const key    = typeof detail === 'object' ? detail.key : detail;
   switch (key) {
     case 'grayscale':
       removeGrayscale(canvas.current);
       break;
     case 'brightness':
       removeBrightness(canvas.current);
       break;
     case 'contrast':
       removeContrast(canvas.current);
       break;
     case 'threshold':
      removeThreshold(canvas.current);
      break;
    case 'sharpen':
     removeSharpen(canvas.current);
      break;
    case 'blur':
      removeBlur(canvas.current);
      break;
    case 'crop':
      removeCrop(canvas.current);
      break;
   }
 };
   window.addEventListener('canvas:undo-filter', undoFilterHandler);


  return () => {
    window.removeEventListener('canvas:apply-filter', applyFilterHandler);
    window.removeEventListener('canvas:undo-filter', undoFilterHandler);
  };
}, []);

  // 1) Fabric canvas init, wheel zoom, layer listeners & reset event
  useEffect(() => {
    const c = new FabricCanvas(canvasRef.current, {
      width: toolOptions.width || 800,
      height: toolOptions.height || 600,
      backgroundColor: toolOptions.backgroundColor || '#ffffff',
    });
    canvas.current = c;
    updateLayers();

    // Initialize zoom state
    const initialZoom = c.getZoom();
    setZoom(initialZoom);
    onZoomChange?.(initialZoom);

    updateLayers();
    c.on('object:added',    updateLayers);
    c.on('object:removed',  updateLayers);
    c.on('object:modified', updateLayers);

    // Wheel zoom (%50–%200)
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

    // Listen for reset event
    window.addEventListener('canvas:reset-zoom', resetZoom);

    return () => {
      c.off('object:added',    updateLayers);
      c.off('object:removed',  updateLayers);
      c.off('object:modified', updateLayers);
      c.off('mouse:wheel', onWheel);
      window.removeEventListener('canvas:reset-zoom', resetZoom);
      c.dispose();
      canvas.current = null;
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

  // 3) Export & Import handlers
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

  // 4) Tool change handler
  useEffect(() => {
    cleanupRef.current?.();
    const c = canvas.current;
    if (!c) return;
    const dpi = getDPI(toolOptions);

    let cleanup = () => {};

    switch (activeTool) {
      case 'brush':   cleanup = initBrushTool(c, toolOptions); break;
      case 'line':    cleanup = initLineTool(c, toolOptions); break;
      case 'rect':    cleanup = initRectTool(c, toolOptions); break;
      case 'ellipse': cleanup = initEllipseTool(c, toolOptions); break;
      case 'polygon': cleanup = initPolygonTool(c, toolOptions); break;
      case 'text':    cleanup = initTextTool(c, toolOptions);    break;
      case 'fill':    cleanup = initFillTool(c, { fillColor: toolOptions.fill }); break;

      case 'measure': {
        // 1) Dinamik ölçümü bağla
       cleanup = initMeasureTool(c, {
          measureLength:  toolOptions.measureLength,
          measureTrigger: toolOptions.measureTrigger,
          dpi,
          unit:           toolOptions.unit || 'mm',
          color:          toolOptions.color
        });

        // 2) Sabit ölçüm: sadece uzunluk > 0 ise
        const ml = toolOptions.measureLength;
        if (ml > 0) {
          const pxLen = (ml / mmPerInch) * dpi;
          const value = toolOptions.unit === 'cm' ? (ml/10) : ml;
          const label = `${value.toFixed(2)} ${toolOptions.unit}`;

          const cx   = c.getWidth()  / 2;
          const cy   = c.getHeight() / 2;
          const half = pxLen / 2;

          const line = new Line([cx-half, cy, cx+half, cy], {
            stroke: 'black', strokeWidth: 2,
            selectable: true, evented: true
          });
          const text = new Text(label, {
            left: cx,
            top:  cy - 20,
            fill: 'black',
            fontSize: 14,
            selectable: true,
            evented: true
          });
          c.add(new Group([line, text], { selectable: true, evented: true }));
        }
        break;
      }

      default:
        break;
    }

    cleanupRef.current = cleanup;
    return () => cleanup();
  }, [activeTool, toolOptions]);


  return (
  <div className="canvas-wrapper">
    <div className="canvas-and-layers" style={{ display: 'flex' }}>
      <div
        className="canvas-container"
        ref={containerRef}
        style={{ flex: 1, position: 'relative' }}
      >
        <canvas ref={canvasRef} />

        <input
          type="file"
          accept=".svg"
          ref={svgInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleSvgUpload(canvas.current)(e)}
        />
        <input
          type="file"
          accept="image/*"
          ref={pngInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handlePngUpload(canvas.current)(e)}
        />
      </div>
          {/* Histogram Analizi Bileşeni */}
          <HistogramAnalysis canvasRef={canvas} />
      <div
        className={`layers-panel ${layersVisible ? 'open' : 'closed'}`}
        style={{ width: 200, borderLeft: '1px solid #ccc' }}
      >
        <div
          className="layers-panel-header"
          onClick={() => setLayersVisible(!layersVisible)}
        >
          Layers {layersVisible ? '▼' : '▲'}
        </div>
        {layersVisible && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {layers.map((layer, idx) => (
              <li
                key={layer.index}
                onClick={() => selectLayer(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selectedLayer === idx ? '#e0e0e0' : 'transparent',
                  padding: '4px',
                  cursor: 'pointer'
                }}
              >
                <span>
                  {layer.name} #{layer.index}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(idx);
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);
}