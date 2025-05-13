// 1) Yeni filtre dosyası: src/filters/sharpenFilter.js
import { filters as FabricFilters } from 'fabric'; 
const { Convolute } = FabricFilters;
/**
 * Uygulanan keskinleştirme filtresi (3×3 Laplacian çekirdeği).
 * @param {fabric.Canvas} canvas
 * @param {number} value  - Filtre kuvveti (örn. 0 - 2 arası)
 */
export function applySharpen(canvas, value = 1) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;

  // Laplacian çekirdeği
  const kernel = [
    0,           -1 * value,  0,
    -1 * value,  1 + 4 * value, -1 * value,
    0,           -1 * value,  0
  ];

 // Önce varsa eski Convolute filtrelerini temizle
 obj.filters = (obj.filters || []).filter(f => !(f instanceof Convolute));
 // Yeni keskinleştirme filtresini ekle
 obj.filters.push(new Convolute({ matrix: kernel }));
 obj.applyFilters();
 canvas.renderAll();
}

/**
 * Keskinleştirme filtresini kaldırır.
 * @param {fabric.Canvas} canvas
 */
export function removeSharpen(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;

obj.filters = (obj.filters || []).filter(f => !(f instanceof Convolute));
obj.applyFilters();
canvas.renderAll();
}

export default applySharpen;