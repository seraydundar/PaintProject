// src/utils/importHandlers.js
import { Image as FabricImage } from 'fabric';

/**
 * Güvenli PNG/JPG yükleme handler'ı.
 * @param {fabric.Canvas} canvas
 * @returns {Function} event handler
 */
export function handlePngUpload(canvas) {
  return event => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ({ target }) => {
        const imgEl = new Image();
        imgEl.onload = () => {
          const fImg = new FabricImage(imgEl, {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
          });
          canvas.add(fImg);
          canvas.setActiveObject(fImg);
          canvas.renderAll();
        };
        imgEl.src = target.result;
      };
      reader.readAsDataURL(file);
    });

    event.target.value = ''; // Dosya yükleme inputunu sıfırla
  };
}

/**
 * Güvenli SVG yükleme handler'ı.
 * @param {fabric.Canvas} canvas
 * @returns {Function} event handler
 */
export function handleSvgUpload(canvas) {
  return event => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ({ target }) => {
        const imgEl = new Image();
        imgEl.onload = () => {
          const fImg = new FabricImage(imgEl, {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
          });
          canvas.add(fImg);
          canvas.setActiveObject(fImg);
          canvas.renderAll();
        };
        imgEl.src = target.result;
      };
      reader.readAsDataURL(file);
    });

    event.target.value = ''; // Dosya yükleme inputunu sıfırla
  };
}
