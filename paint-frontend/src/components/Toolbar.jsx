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

const FILTER_OPTIONS = [
  { key: 'grayscale', label: 'Griye Çevir' },
  { key: 'brightness', label: 'Parlaklık Ayarı' },
  { key: 'contrast', label: 'Kontrast Artırma' },
  { key: 'threshold', label: 'Eşikleme' },
  { key: 'sharpen', label: 'Keskinleştirme' },
  { key: 'blur', label: 'Bulanıklaştırma' },
  { key: 'filter', label: 'Filtreleme' },
  { key: 'resize', label: 'Boyutlandırma' },
  { key: 'rotate', label: 'Döndürme' },
  { key: 'crop', label: 'Kırpma' },
  { key: 'histogram', label: 'Histogram Analizi' },
];

export default function Toolbar({ activeTool, onToolChange, toolOptions, onOptionChange, onClear }) {
  const [measureInput, setMeasureInput] = useState('');
  // state for filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  const [brightnessValue, setBrightnessValue] = useState(0);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [contrastValue, setContrastValue] = useState(0);
  const [showContrastSlider, setShowContrastSlider] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(0.5);
  const [showThresholdSlider, setShowThresholdSlider] = useState(false);
  const [sharpenValue, setSharpenValue] = useState(1);
  const [showSharpenSlider, setShowSharpenSlider] = useState(false);

  const { color, fill, strokeWidth, brushWidth, fontSize, sides, unit } = toolOptions;

  const currentSize =
    activeTool === 'brush' ? brushWidth : activeTool === 'text' ? fontSize : strokeWidth;

  const handleSizeChange = (e) => {
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

  // handler for filter selection
  const handleFilterClick = (filterKey) => {
  const detail =
    filterKey === 'brightness'
      ? { key: 'brightness', value: brightnessValue }
      : filterKey;
  window.dispatchEvent(new CustomEvent('canvas:apply-filter', { detail }));
  // Sadece crop değilse filtre panelini kapat
  if (filterKey !== 'crop') {
    setShowFilters(false);
  }
};

const handleUndoClick = (filterKey) => {
  const detail = filterKey === 'brightness' ? { key: 'brightness' } : filterKey;
  window.dispatchEvent(
    new CustomEvent('canvas:undo-filter', { detail })
  );
  setShowFilters(false);
};

//Histogram için ayrı handler
  const handleHistogramClick = () => {
    window.dispatchEvent(new Event('canvas:histogram'));
    setShowFilters(false);
  
  };

  return (
    <div className="toolbar-container" style={{ position: 'relative' }}>
      {/* tool icons */}
      {Object.entries(TOOL_ICONS).map(([key, icon]) => (
        <button
          key={key}
          className={`tool-button ${activeTool === key ? 'active' : ''}`}
          onClick={() => onToolChange(key)}
          data-tooltip={key.charAt(0).toUpperCase() + key.slice(1)}
        >
          {icon}
        </button>
      ))}

      {/* color picker */}
      <label className="toolbar-option">
        Renk:
        <input type="color" value={color} onChange={(e) => handleOptionChange('color', e.target.value)} />
      </label>

      {/* fill picker */}
      {activeTool === 'fill' && (
        <label className="toolbar-option">
          Dolgu:
          <input type="color" value={fill} onChange={(e) => handleOptionChange('fill', e.target.value)} />
        </label>
      )}

      {/* size controls */}
      <label className="toolbar-option">
        Boyut:
        <input type="range" min={1} max={100} value={currentSize} onChange={handleSizeChange} />
        <input
          type="number"
          min={1}
          max={100}
          value={currentSize}
          onChange={handleSizeChange}
          style={{ width: 50, marginLeft: 8, padding: 2 }}
        />{' '}
        px
      </label>

      {/* measure options */}
      {activeTool === 'measure' && (
        <>
          <label className="toolbar-option">
            Uzunluk:
            <input
              type="number"
              min={0}
              value={measureInput}
              onChange={(e) => setMeasureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(measureInput) || 0;
                  onOptionChange({ ...toolOptions, measureLength: val, measureTrigger: Date.now() });
                  setMeasureInput('');
                }
              }}
              style={{ width: 60, marginLeft: 8, padding: 2 }}
            />
          </label>
          <label className="toolbar-option">
            Birim:
            <select
              value={unit}
              onChange={(e) => handleOptionChange('unit', e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
              <option value="px">px</option>
            </select>
          </label>
        </>
      )}
      

      {/* actions */}
      <button className="tool-button clear-button" onClick={onClear} data-tooltip="Temizle">
        🗑️
      </button>
      <button className="tool-button" onClick={() => window.dispatchEvent(new Event('canvas:export-svg'))} data-tooltip="SVG Kaydet">
        💾
      </button>
      <button className="tool-button" onClick={() => window.dispatchEvent(new Event('canvas:export-png'))} data-tooltip="PNG Kaydet">
        🖼️
      </button>
      <button className="tool-button" onClick={() => window.dispatchEvent(new Event('canvas:import-svg'))} data-tooltip="SVG Yükle">
        📂
      </button>
      <button className="tool-button" onClick={() => window.dispatchEvent(new Event('canvas:import-png'))} data-tooltip="PNG Yükle">
        📥
      </button>
      <button className="tool-button" onClick={() => setShowFilters(!showFilters)} data-tooltip="Filtreler">
        🎛️
      </button>


      {/* Filtre panel */}
      {showFilters && (
        <div
          className="filter-panel"
          style={{
            position: 'absolute',
            top: 50,
            right: 10,
            background: '#fff',
            padding: 8,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          {FILTER_OPTIONS.map((opt) => {
  // Parlaklık filtresi
  if (opt.key === 'brightness') {
    return (
      <div
        key={opt.key}
        style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}
      >
        {/* 1️⃣ Buton: Parlaklık */}
        <button
          className="filter-button"
          onClick={() => setShowBrightnessSlider((v) => !v)}
          style={{ textAlign: 'left', padding: '4px 8px' }}
        >
          {opt.label}
        </button>
        {/* 2️⃣ Undo */}
        <button
          className="filter-button"
          onClick={() => handleUndoClick('brightness')}
          style={{ marginTop: 4, padding: '4px', alignSelf: 'flex-end' }}
          title="Geri Al"
        >
          ↩️
        </button>


        {/* 3️⃣ Slider: yalnızca butona basıldığında açılır */}
        {showBrightnessSlider && (
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={brightnessValue}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setBrightnessValue(v);
              window.dispatchEvent(
                new CustomEvent('canvas:apply-filter', {
                  detail: { key: 'brightness', value: v },
                })
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
        )}
      </div>
    );
  }
   if (opt.key === 'histogram') {
              return (
                <div key={opt.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <button
                    className="filter-button"
                    onClick={handleHistogramClick}
                    style={{ flex: 1, textAlign: 'left', padding: '4px 8px' }}
                  >
                    {opt.label}
                  </button>
                  {/* Histogram için geri almayı desteklemiyoruz, bu yüzden burayı boş bırakabiliriz */}
                </div>
              );
            }

  // Kontrast filtresi
  if (opt.key === 'contrast') {
    return (
      <div
        key={opt.key}
        style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}
      >
        {/* 1️⃣ Buton: Kontrast Artırma */}
        <button
          className="filter-button"
          onClick={() => setShowContrastSlider((v) => !v)}
          style={{ textAlign: 'left', padding: '4px 8px' }}
        >
          {opt.label}
        </button>
        {/* 2️⃣ Undo */}
        <button
          className="filter-button"
          onClick={() => handleUndoClick('contrast')}
          style={{ marginTop: 4, padding: '4px', alignSelf: 'flex-end' }}
          title="Geri Al"
        >
          ↩️
        </button>
        {/* 3️⃣ Slider: yalnızca butona basıldığında açılır */}
        {showContrastSlider && (
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={contrastValue}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setContrastValue(v);
              window.dispatchEvent(
                new CustomEvent('canvas:apply-filter', {
                  detail: { key: 'contrast', value: v },
                })
              );
            }}
            style={{ width: '100%', marginTop: 8 }}
          />
        )}
      </div>
    );
  }
   // 〽️ Eşikleme (Thresholding) filtresi
   if (opt.key === 'threshold') {
     return (
       <div
         key={opt.key}
         style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}
       >
         {/* 1️⃣ Buton: Eşikleme */}
         <button
           className="filter-button"
           onClick={() => setShowThresholdSlider(v => !v)}
           style={{ textAlign: 'left', padding: '4px 8px' }}
         >
           {opt.label}
         </button>
         {/* 2️⃣ Undo */}
         <button
           className="filter-button"
           onClick={() => handleUndoClick('threshold')}
           style={{ marginTop: 4, padding: '4px', alignSelf: 'flex-end' }}
           title="Geri Al"
         >
           ↩️
         </button>
         {/* 3️⃣ Slider */}
         {showThresholdSlider && (
           <input
             type="range"
             min={0}
             max={1}
             step={0.01}
             value={thresholdValue}
             onChange={(e) => {
               const v = parseFloat(e.target.value);
               setThresholdValue(v);
               window.dispatchEvent(
                 new CustomEvent('canvas:apply-filter', {
                   detail: { key: 'threshold', value: v },
                 })
               );
             }}
             style={{ width: '100%', marginTop: 8 }}
           />
         )}
       </div>
     );
   }
   

            return (
              <div
                key={opt.key}
                style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
              >
                <button
                  className="filter-button"
                  onClick={() => handleFilterClick(opt.key)}
                  style={{ flex: 1, textAlign: 'left', padding: '4px 8px' }}
                >
                  {opt.label}
                </button>
                <button
                  className="filter-button"
                  onClick={() => handleUndoClick(opt.key)}
                  style={{ marginLeft: 8, padding: '4px' }}
                  title="Geri Al"
                >
                  ↩️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}