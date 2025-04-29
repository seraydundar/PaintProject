// src/components/Toolbar.jsx
import React from 'react';
import '../App.css';

const TOOL_ICONS = {
  select:  '🖱️',
  brush:   '🖌️',
  line:    '✏️',
  rect:    '▭',
  ellipse: '◯',
  polygon: '🔷',
  text:    '📝',
  fill:    '🎨',
  measure: '📏',
};

export default function Toolbar({
  activeTool,
  onToolChange,
  toolOptions,
  onOptionChange,
  onClear
}) {
  const {
    color,
    fill,
    strokeWidth,
    brushWidth,
    fontSize,
    sides
  } = toolOptions;

  // Aktif aracın "boyut" değeri
  const currentSize = activeTool === 'brush'
    ? brushWidth
    : activeTool === 'text'
      ? fontSize
      : strokeWidth;

  const handleSizeChange = e => {
    const newSize = parseInt(e.target.value, 10) || 1;
    let updated = { ...toolOptions };
    if (activeTool === 'brush') {
      updated.brushWidth = newSize;
    } else if (activeTool === 'text') {
      updated.fontSize = newSize;
    } else {
      updated.strokeWidth = newSize;
    }
    onOptionChange(updated);
  };

  return (
    <div className="toolbar-container">
      {/* Araç Butonları */}
      {Object.entries(TOOL_ICONS).map(([key, icon]) => (
        <button
          key={key}
          className={`tool-button ${activeTool === key ? 'active' : ''}`}
          data-tooltip={key.charAt(0).toUpperCase() + key.slice(1)}
          onClick={() => onToolChange(key)}
        >
          {icon}
        </button>
      ))}

      {/* Renk Seçici */}
      <label className="toolbar-option">
        <span>Renk:</span>
        <input
          type="color"
          value={color ?? '#000000'}
          onChange={e =>
            onOptionChange({ ...toolOptions, color: e.target.value })
          }
        />
      </label>

      {/* Dolgu Rengi */}
      <label className="toolbar-option">
        <span>Dolgu:</span>
        <input
          type="color"
          value={fill ?? '#000000'}
          onChange={e =>
            onOptionChange({ ...toolOptions, fill: e.target.value })
          }
        />
      </label>

      {/* Boyut (tüm araçlarda) */}
      <label className="toolbar-option">
        <span>Boyut:</span>
        <input
          type="range"
          min={1}
          max={100}
          value={currentSize}
          onChange={handleSizeChange}
        />
        <span>{currentSize}px</span>
      </label>

      {/* Polygon Kenar Sayısı */}
      {activeTool === 'polygon' && (
        <label className="toolbar-option">
          <span>Kenar:</span>
          <input
            type="number"
            min={3}
            max={12}
            value={sides}
            onChange={e =>
              onOptionChange({
                ...toolOptions,
                sides: parseInt(e.target.value, 10)
              })
            }
          />
        </label>
      )}

      {/* Ölçek ve Birim kontrolleri kaldırıldı */}

      {/* Temizle ve Kaydet/Yükle */}
      <button
        className="tool-button clear-button"
        data-tooltip="Temizle"
        onClick={onClear}
      >
        🗑️
      </button>
      <button
        className="tool-button"
        data-tooltip="SVG Kaydet"
        onClick={() => window.dispatchEvent(new Event('canvas:export-svg'))}
      >
        💾
      </button>
      <button
        className="tool-button"
        data-tooltip="PNG Kaydet"
        onClick={() => window.dispatchEvent(new Event('canvas:export-png'))}
      >
        🖼️
      </button>
      <button
        className="tool-button"
        data-tooltip="SVG Yükle"
        onClick={() => window.dispatchEvent(new Event('canvas:import-svg'))}
      >
        📂
      </button>
      <button
        className="tool-button"
        data-tooltip="PNG Yükle"
        onClick={() => window.dispatchEvent(new Event('canvas:import-png'))}
      >
        📥
      </button>
    </div>
  );
}
