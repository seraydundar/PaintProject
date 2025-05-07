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

      {/* Renk Seçici (her zaman görünür) */}
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

      {/* Dolgu Rengi, yalnızca 'fill' aracı seçili iken */}
      {activeTool === 'fill' && (
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
      )}

      {/* Boyut (slider + sayı girişi) */}
      <label className="toolbar-option">
  <span>Boyut:</span>
  <input
    type="range"
    min={1}
    max={100}
    value={currentSize}
    onChange={handleSizeChange}
  />
  <input
    type="number"
    min={1}
    max={100}
    value={currentSize}
    onChange={handleSizeChange}
    style={{ width: '50px', marginLeft: '8px', padding: '2px' }}
  />
  {/* Sadece ölçüm aracı değilse px göster */}
  {activeTool !== 'measure' && (
    <span style={{ marginLeft: '4px' }}>px</span>
  )}
</label>

     {activeTool === 'measure' && (
       <label className="toolbar-option">
         <span>Uzunluk (mm):</span>
         <input
           type="number"
           min="0"
           value={toolOptions.measureLength || ''}
           onChange={e => onOptionChange({
             ...toolOptions,
             measureLength: parseFloat(e.target.value) || 0
           })}
           onKeyDown={e => {
                  if (e.key === 'Enter') {
                     onOptionChange({
                       ...toolOptions,
                       measureTrigger: Date.now()   // tetikleyici olarak timestamp koyuyoruz
                     });
                  }
                 }}
           style={{ width: '60px', marginLeft: '8px', padding: '2px' }}
         />
       </label>
     )}

      
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
