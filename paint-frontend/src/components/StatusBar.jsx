// src/components/StatusBar.jsx
import React from 'react';

export default function StatusBar({ activeTool, zoom }) {
  const handleReset = () => {
    // Canvas bileşeni bu event’i dinleyip zoom’u %100’e çekecek
    window.dispatchEvent(new Event('canvas:reset-zoom'));
  };

  return (
    <div className="status-bar">
      Aktif Araç:{' '}
      <span className="status-tool">
        {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
      </span>
      <span
        className="status-zoom"
        onClick={handleReset}
        style={{ cursor: 'pointer', textDecoration: 'underline' }}
        title="Zoom’u %100’e sıfırla"
      >
        Zoom: {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
