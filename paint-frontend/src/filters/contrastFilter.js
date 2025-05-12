// src/filters/contrastFilter.js
import { filters as FabricFilters } from 'fabric';
const { Contrast } = FabricFilters;

/**
 * Uygular: mevcut Contrast filtresini kaldırır, yeni bir tane ekler.
 * @param {fabric.Canvas} canvas
 * @param {number} value - -1 ile 1 arasında kontrast değeri
 */
export function applyContrast(canvas, value = 0) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resim seçin.');
    return;
  }
  // Önce eski Contrast filtrelerini temizle, diğer filtreleri koru
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Contrast));
  obj.filters.push(new Contrast({ contrast: value }));
  obj.applyFilters();
  canvas.renderAll();
}

/**
 * Geri alır: sadece Contrast filtresini kaldırır.
 * @param {fabric.Canvas} canvas
 */
export function removeContrast(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Contrast));
  obj.applyFilters();
  canvas.renderAll();
}

// Varsayılan export
export default applyContrast;
