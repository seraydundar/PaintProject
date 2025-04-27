// src/App.jsx
import React, { useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';

function App() {
  const [activeTool, setActiveTool] = useState('select');
  const [toolOptions, setToolOptions] = useState({
    color: '#000000',
    strokeWidth: 2,
    brushWidth: 5,
    fill: 'transparent',
    sides: 5,
    fontSize: 20,
  });

  const handleClear = useCallback(() => {
    window.dispatchEvent(new Event('canvas:clear'));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Fabric.js Paint App</h2>
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
      />
    </div>
  );
}

export default App;
