// src/components/Toolbar.jsx
import React from 'react';

export default function Toolbar({
  activeTool, onToolChange,
  toolOptions, onOptionChange,
  onClear
}) {
  const tools = [
    'select', 'brush', 'line',
    'rect', 'ellipse', 'polygon',
    'text', 'fill'
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 12
    }}>
      {tools.map(tool => (
        <button
          key={tool}
          style={{
            padding: '6px 12px',
            background: activeTool === tool ? '#555' : '#eee',
            color: activeTool === tool ? '#fff' : '#000',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
          onClick={() => onToolChange(tool)}
        >
          {tool.charAt(0).toUpperCase() + tool.slice(1)}
        </button>
      ))}

      {/* Çizgi/Renk: */}
      <label style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span>Renk:</span>
        <input
          type="color"
          value={toolOptions.color}
          onChange={e =>
            onOptionChange({ ...toolOptions, color: e.target.value })
          }
        />
      </label>

      {/* Dolgu Rengi: */}
      <label style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span>Dolgu:</span>
        <input
          type="color"
          value={toolOptions.fill}
          onChange={e =>
            onOptionChange({ ...toolOptions, fill: e.target.value })
          }
        />
      </label>

      {/* Kalınlık */}
      <label style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span>Kalınlık:</span>
        <input
          type="number" min={1} max={50}
          value={toolOptions.strokeWidth}
          onChange={e =>
            onOptionChange({
              ...toolOptions,
              strokeWidth: parseInt(e.target.value, 10)
            })
          }
          style={{ width:60 }}
        />
      </label>

      {activeTool === 'polygon' && (
        <label style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span>Kenar:</span>
          <input
            type="number" min={3} max={12}
            value={toolOptions.sides}
            onChange={e =>
              onOptionChange({
                ...toolOptions,
                sides: parseInt(e.target.value, 10)
              })
            }
            style={{ width:60 }}
          />
        </label>
      )}

      {activeTool === 'text' && (
        <label style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span>Font:</span>
          <input
            type="number" min={8} max={72}
            value={toolOptions.fontSize}
            onChange={e =>
              onOptionChange({
                ...toolOptions,
                fontSize: parseInt(e.target.value, 10)
              })
            }
            style={{ width:60 }}
          />
        </label>
      )}

      <button
        onClick={onClear}
        style={{
          padding:'6px 12px', marginLeft:'auto',
          background:'#d9534f', color:'#fff',
          border:'none', borderRadius:4
        }}
      >
        Temizle
      </button>
    </div>
  );
}
