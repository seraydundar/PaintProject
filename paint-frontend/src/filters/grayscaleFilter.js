// src/filters/grayscaleFilter.js
import { filters as FabricFilters } from 'fabric';
const { Grayscale } = FabricFilters;

/**
 * Monkey-patch: Grayscale filtresinin tüm 2D context okuma
 * işlemlerini willReadFrequently: true ile yapmasını sağlıyoruz.
 */
;(function patchGrayscale() {
  const proto = Grayscale.prototype;
  ['applyTo2d', 'applyTo'].forEach(method => {
    if (typeof proto[method] === 'function') {
      const original = proto[method];
      proto[method] = function(canvasEl, ...args) {
        // Geçici olarak getContext’i saralım
        const oldGet = canvasEl.getContext;
        canvasEl.getContext = function(type/*, opts ignored*/) {
          // Yalnızca 2d talebinde willReadFrequently ekliyoruz
          if (type === '2d') {
            return oldGet.call(canvasEl, type, { willReadFrequently: true });
          }
          return oldGet.call(canvasEl, type);
        };
        try {
          // Orijinal işlemi yap
          return original.call(this, canvasEl, ...args);
        } finally {
          // Eski haline döndür
          canvasEl.getContext = oldGet;
        }
      };
    }
  });
})();

export function applyGrayscale(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resmi seçin.');
    return;
  }
  // Önceki Grayscale filtrelerini çıkarıp, yenisini ekliyoruz
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Grayscale));
  obj.filters.push(new Grayscale());
  obj.applyFilters();
  canvas.renderAll();
}

export function removeGrayscale(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Grayscale));
  obj.applyFilters();
  canvas.renderAll();
}

export default applyGrayscale;
