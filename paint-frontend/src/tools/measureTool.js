// src/tools/measureTool.js
import { Line, Text, Group } from 'fabric';

// Her inç için mm değeri
const mmPerInch = 25.4;

/**
 * Simple measure tool: dynamic drag measurement and static measurement on Enter.
 * Supports 'mm', 'cm', 'in' (inches), or 'px' (pixels) display units.
 */
export function initMeasureTool(canvas, options) {
  const { measureLength = 0, measureTrigger = 0, dpi, unit = 'mm' } = options;

  // Static measurement: when Enter pressed
  if (measureTrigger > 0 && measureLength > 0) {
    const pxLen = convertToPixels(measureLength, unit, dpi);
    const label = `${measureLength} ${unit}`;
    drawMeasurement(canvas, pxLen, label);
  }

  // Dynamic measurement variables
  let start = null;
  let previewLine = null;
  let previewText = null;
  let measuring = false;

  // On mouse down, start measuring
  function onMouseDown(e) {
    measuring = true;
    start = canvas.getPointer(e.e);
    previewLine = new Line([start.x, start.y, start.x, start.y], {
      stroke: 'black',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });
    previewText = new Text('', {
      left: start.x,
      top: start.y - 20,
      fill: 'black',
      fontSize: 14,
      selectable: false,
      evented: false
    });
    canvas.add(previewLine, previewText);
  }

  // On mouse move, update measurement
  function onMouseMove(e) {
    if (!measuring) return;
    const p = canvas.getPointer(e.e);
    previewLine.set({ x2: p.x, y2: p.y });
    const distPx = Math.hypot(p.x - start.x, p.y - start.y);
    const displayValue = convertFromPixels(distPx, unit, dpi);

    previewText.set({
      text: `${displayValue.toFixed(2)} ${unit}`,
      left: (start.x + p.x) / 2,
      top: (start.y + p.y) / 2 - 20
    });
    canvas.renderAll();
  }

  // On mouse up, end measuring
  function onMouseUp() { measuring = false; }

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);

  // Cleanup
  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('mouse:move', onMouseMove);
    canvas.off('mouse:up', onMouseUp);
  };
}

// Helper to convert measurements
function convertToPixels(value, unit, dpi) {
  switch (unit) {
    case 'cm': return (value * 10 / mmPerInch) * dpi;
    case 'in': return (value * dpi);
    case 'px': return value;
    default: return (value / mmPerInch) * dpi;
  }
}

function convertFromPixels(px, unit, dpi) {
  switch (unit) {
    case 'cm': return (px / dpi) * mmPerInch / 10;
    case 'in': return (px / dpi);
    case 'px': return px;
    default: return (px / dpi) * mmPerInch;
  }
}

// Helper to draw static measurement
function drawMeasurement(canvas, lengthPx, label) {
  const cx = canvas.getWidth() / 2;
  const cy = canvas.getHeight() / 2;
  const half = lengthPx / 2;

  const line = new Line([cx - half, cy, cx + half, cy], {
    stroke: 'black', strokeWidth: 2,
    selectable: true, evented: true
  });

  const text = new Text(label, {
    left: cx,
    top: cy - 20,
    fill: 'black',
    fontSize: 14,
    selectable: true,
    evented: true
  });

  canvas.add(new Group([line, text], { selectable: true, evented: true }));
}