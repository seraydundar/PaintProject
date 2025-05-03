// src/App.jsx
import React, { useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';
import './App.css';

function App() {
  const [activeTool, setActiveTool] = useState('select');
  const [toolOptions, setToolOptions] = useState({
    color: '#6a1b9a',
    strokeWidth: 4,
    brushWidth: 8,
    fill: 'transparent',
    sides: 5,
    fontSize: 20,
    scale: 1,
    unit: 'px',
  });
  const [zoom, setZoom] = useState(1);

  const handleClear = useCallback(() => {
    window.dispatchEvent(new Event('canvas:clear'));
  }, []);

  return (
    <div className="app-container">
      <h2 className="app-title">🐾 IgorStudio </h2>
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        toolOptions={toolOptions}
        onOptionChange={setToolOptions}
        onClear={handleClear}
      />
       <Canvas
       activeTool={activeTool}
       toolOptions={toolOptions}
       onZoomChange={setZoom}
       />
       <StatusBar activeTool={activeTool} zoom={zoom} />

    </div>
  );
}

export default App;