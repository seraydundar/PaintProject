// src/tools/polygonTool.js
import * as fabric from 'fabric';

/**
 * Çokgen (polygon) aracını başlatır.
 * Click ile kenar ekler; başlangıç noktasına tıklayınca polygon kapanır.
 * Oluşan polygon üzerindeki köşeleri tıklayıp sürükleyerek düzenleyebilirsiniz.
 */
export function initPolygonTool(canvas, options) {
  const { color, strokeWidth, fillColor = 'transparent' } = options;
  let points = [];
  let tempMarkers = [];
  let tempLines = [];
  const finishThreshold = 8; // polygon kapanma toleransı

  // Poligonu düzenleme moduna geçirir ve kontrolleri gösterir
  function enableEditing(poly) {
    poly.set({
      objectCaching: false,
      selectable: true,
      hasBorders: false,
      hasControls: true
    });
    const existing = poly.controls || {};
    const vertexControls = poly.points.reduce((acc, pt, idx) => {
      acc[`p${idx}`] = new fabric.Control({
        positionHandler: (dim, finalMatrix, obj) => {
          const point = obj.points[idx];
          return fabric.util.transformPoint(
            { x: point.x, y: point.y },
            obj.calcTransformMatrix()
          );
        },
        actionHandler: (eventData, transform) => {
          const pObj = (transform && transform.target) || eventData.target;
          if (!pObj) return false;
          const pointer = pObj.canvas.getPointer(eventData.e || eventData);
          const local = fabric.util.transformPoint(
            { x: pointer.x, y: pointer.y },
            fabric.util.invertTransform(pObj.calcTransformMatrix())
          );
          pObj.points[idx] = { x: local.x, y: local.y };
          pObj.dirty = true;
          canvas.requestRenderAll();
          return true;
        },
        cursorStyleHandler: () => 'pointer',
        render: fabric.controlsUtils.renderCircleControl,
        cornerSize: 6,
        withConnection: false
      });
      return acc;
    }, {});
    poly.controls = { ...existing, ...vertexControls };
    canvas.setActiveObject(poly);
    canvas.requestRenderAll();
  }

  // Canvas tıklama: nokta ekle veya polygonu tamamla
  function onClick(e) {
    const { x, y } = canvas.getPointer(e.e);
    // Polygon kapanma kontrolü
    if (points.length >= 3) {
      const first = points[0];
      if (Math.hypot(x - first.x, y - first.y) <= finishThreshold) {
        canvas.off('mouse:down', onClick);
        tempMarkers.forEach(m => canvas.remove(m));
        tempLines.forEach(l => canvas.remove(l));
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const relPoints = points.map(p => ({ x: p.x - minX, y: p.y - minY }));
        const poly = new fabric.Polygon(relPoints, {
          left: minX,
          top: minY,
          fill: fillColor,
          stroke: color,
          strokeWidth,
          objectCaching: false,
          selectable: true
        });
        canvas.add(poly);
        poly._calcDimensions();
        poly.setCoords();
        enableEditing(poly);
        points = [];
        tempMarkers = [];
        tempLines = [];
        return;
      }
    }
    // Yeni nokta ekle
    points.push({ x, y });
    const marker = new fabric.Circle({
      left: x,
      top: y,
      radius: 4,
      fill: color,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
    canvas.add(marker);
    tempMarkers.push(marker);
    if (points.length > 1) {
      const prev = points[points.length - 2];
      const line = new fabric.Line([prev.x, prev.y, x, y], {
        stroke: color,
        strokeWidth,
        selectable: false,
        evented: false
      });
      canvas.add(line);
      tempLines.push(line);
    }
  }

  canvas.on('mouse:down', onClick);
  return () => {
    canvas.off('mouse:down', onClick);
  };
}
