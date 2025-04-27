// src/components/StatusBar.jsx
import React from 'react';
import '../App.css';

export default function StatusBar({ activeTool }) {
  return (
    <div className="status-bar">
      Aktif Araç: <span className="status-tool">{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</span>
    </div>
  );
}
