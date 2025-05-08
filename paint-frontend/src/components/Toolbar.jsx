import React, { useState } from 'react';
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
  const [measureInput, setMeasureInput] = useState('');
  const { color, fill, strokeWidth, brushWidth, fontSize, sides } = toolOptions;

  // Determine current size
  const currentSize = activeTool === 'brush'
    ? brushWidth
    : activeTool === 'text'
      ? fontSize
      : strokeWidth;

  const handleSizeChange = e => {
    const newSize = parseInt(e.target.value, 10) || 1;
    const updated = { ...toolOptions };
    if (activeTool === 'brush') updated.brushWidth = newSize;
    else if (activeTool === 'text') updated.fontSize = newSize;
    else updated.strokeWidth = newSize;
    onOptionChange(updated);
  };

  const handleOptionChange = (key, value) => {
    onOptionChange({ ...toolOptions, [key]: value });
  };

  return (
    <div className="toolbar-container">
      {/* Tool Buttons */}
      {Object.entries(TOOL_ICONS).map(([key, icon]) => (
        <button
          key={key}
          className={`tool-button ${activeTool === key ? 'active' : ''}`}
          data-tooltip={key.charAt(0).toUpperCase() + key.slice(1)}
          onClick={() => onToolChange(key)}
        >{icon}</button>
      ))}

      {/* Color Picker */}
      <label className="toolbar-option">
        <span>Renk:</span>
        <input
          type="color"
          value={color}
          onChange={e => handleOptionChange('color', e.target.value)}
        />
      </label>

      {/* Fill Color */}
      {activeTool === 'fill' && (
        <label className="toolbar-option">
          <span>Dolgu:</span>
          <input
            type="color"
            value={fill}
            onChange={e => handleOptionChange('fill', e.target.value)}
          />
        </label>
      )}

      {/* Size Slider */}
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
        {activeTool !== 'measure' && <span style={{ marginLeft: '4px' }}>px</span>}
      </label>

      {/* Measure Options: only Length and Unit */}
      {activeTool === 'measure' && (
        <>
          <label className="toolbar-option">
            <span>Uzunluk (mm):</span>
            <input
              type="number"
              min="0"
              value={measureInput}
              onChange={e => setMeasureInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = parseFloat(measureInput) || 0;
                  onOptionChange({
                    ...toolOptions,
                    measureLength: val,
                    measureTrigger: Date.now()
                  });
                  setMeasureInput('');
                }
              }}
              style={{ width: '60px', marginLeft: '8px', padding: '2px' }}
            />
          </label>
          <label className="toolbar-option">
            <span>Birim:</span>
            <select
              value={toolOptions.unit}
              onChange={e => handleOptionChange('unit', e.target.value)}
              style={{ marginLeft: '8px' }}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
              <option value="px">px</option>
            </select>
          </label>
        </>
      )}

      {/* Clear & Export/Import */}
      <button className="tool-button clear-button" data-tooltip="Temizle" onClick={onClear}>🗑️</button>
      <button className="tool-button" data-tooltip="SVG Kaydet" onClick={() => window.dispatchEvent(new Event('canvas:export-svg'))}>💾</button>
      <button className="tool-button" data-tooltip="PNG Kaydet" onClick={() => window.dispatchEvent(new Event('canvas:export-png'))}>🖼️</button>
      <button className="tool-button" data-tooltip="SVG Yükle" onClick={() => window.dispatchEvent(new Event('canvas:import-svg'))}>📂</button>
      <button className="tool-button" data-tooltip="PNG Yükle" onClick={() => window.dispatchEvent(new Event('canvas:import-png'))}>📥</button>
    </div>
  );
}
