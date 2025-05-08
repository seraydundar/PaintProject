// src/tools/fillTool.js

export function initFillTool(canvas, options) {
    const fillColor = options.fillColor; 
  
    const onMouseDown = ({ target }) => {
      if (target && typeof target.set === 'function') {
        target.set('fill', fillColor);
        canvas.renderAll();
      }
    };
  
    canvas.on('mouse:down', onMouseDown);
    return () => canvas.off('mouse:down', onMouseDown);
  }
  