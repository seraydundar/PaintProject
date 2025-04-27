// src/components/Toolbar.jsx
import React from 'react';
import '../App.css';

const TOOL_ICONS = {
  select: '🖱️',
  brush: '🖌️',
  line: '✏️',
  rect: '▭',
  ellipse: '◯',
  polygon: '🔷',
  text: '📝',
  fill: '🎨',
  measure: '📏',
};

export default function Toolbar({ activeTool, onToolChange, toolOptions, onOptionChange, onClear }) {
  const tools = Object.keys(TOOL_ICONS).map(key => ({ key, icon: TOOL_ICONS[key] }));

  return (
    <div className="toolbar-container">
      {tools.map(tool => (
        <button
          key={tool.key}
          className={`tool-button ${activeTool === tool.key ? 'active' : ''}`}
          data-tooltip={tool.key.charAt(0).toUpperCase() + tool.key.slice(1)}
          onClick={() => onToolChange(tool.key)}
        >
          {tool.icon}
        </button>
      ))}

      {/* Renk, Dolgu, Kalınlık etc. seçenekler */}
      <label className="toolbar-option">
        <span>Renk:</span>
        <input
          type="color"
          value={toolOptions.color}
          onChange={e => onOptionChange({ ...toolOptions, color: e.target.value })}
        />
      </label>
      <label className="toolbar-option">
        <span>Dolgu:</span>
        <input
          type="color"
          value={toolOptions.fill}
          onChange={e => onOptionChange({ ...toolOptions, fill: e.target.value })}
        />
      </label>
      <label className="toolbar-option">
        <span>Kalınlık:</span>
        <input
          type="number" min={1} max={50}
          value={toolOptions.strokeWidth}
          onChange={e => onOptionChange({ ...toolOptions, strokeWidth: parseInt(e.target.value, 10) })}
        />
      </label>

      {activeTool === 'polygon' && (
        <label className="toolbar-option">
          <span>Kenar:</span>
          <input
            type="number" min={3} max={12}
            value={toolOptions.sides}
            onChange={e => onOptionChange({ ...toolOptions, sides: parseInt(e.target.value, 10) })}
          />
        </label>
      )}

      {activeTool === 'text' && (
        <label className="toolbar-option">
          <span>Font:</span>
          <input
            type="number" min={8} max={72}
            value={toolOptions.fontSize}
            onChange={e => onOptionChange({ ...toolOptions, fontSize: parseInt(e.target.value, 10) })}
          />
        </label>
      )}

      {activeTool === 'measure' && (
        <>
          <label className="toolbar-option">
            <span>Ölçek:</span>
            <input
              type="number" min={1}
              value={toolOptions.scale}
              onChange={e => onOptionChange({ ...toolOptions, scale: parseFloat(e.target.value) || 1 })}
            />
          </label>
          <label className="toolbar-option">
            <span>Birim:</span>
            <input
              type="text"
              value={toolOptions.unit}
              onChange={e => onOptionChange({ ...toolOptions, unit: e.target.value })}
            />
          </label>
        </>
      )}

      {/* Dosya ve Temizleme Butonları */}
      <button
        className="tool-button clear-button"
        data-tooltip="Temizle"
        onClick={onClear}
      >🗑️</button>
      <button
        className="tool-button"
        data-tooltip="SVG Kaydet"
        onClick={() => window.dispatchEvent(new Event('canvas:export-svg'))}
      >💾</button>
      <button
        className="tool-button"
        data-tooltip="PNG Kaydet"
        onClick={() => window.dispatchEvent(new Event('canvas:export-png'))}
      >🖼️</button>
      <button
        className="tool-button"
        data-tooltip="SVG Yükle"
        onClick={() => window.dispatchEvent(new Event('canvas:import-svg'))}
      >📂</button>
      <button
        className="tool-button"
        data-tooltip="PNG Yükle"
        onClick={() => window.dispatchEvent(new Event('canvas:import-png'))}
      >📥</button>
    </div>
  );
}