// src/components/StatusBar.jsx
import React from 'react';

export default function StatusBar({ activeTool, zoom, onResetZoom }) {
  return (
    <div className="status-bar">
      Aktif Araç:{' '}
      <span className="status-tool">
        {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
      </span>
      <span
        className="status-zoom"
        onClick={onResetZoom}
      >
        Zoom: {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
