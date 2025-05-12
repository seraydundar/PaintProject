// 1. src/filters/brightnessFilter.js
import { filters as FabricFilters } from 'fabric';
const { Brightness } = FabricFilters;

/**
 * Uygular: mevcut Brightness filtresini kaldırır, yeni bir tane ekler.
 * @param {fabric.Canvas} canvas
 * @param {number} value - -1 ile 1 arasında parlaklık değeri
 */
export function applyBrightness(canvas, value = 0) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resim seçin.');
    return;
  }
  // Önce eski Brightness filtrelerini temizle
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Brightness));
  // Yeni Brightness filtresini ekle
  obj.filters.push(new Brightness({ brightness: value }));
  obj.applyFilters();
  canvas.renderAll();
}

/**
 * Geri alır: sadece Brightness filtresini kaldırır.
 * @param {fabric.Canvas} canvas
 */
export function removeBrightness(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Brightness));
  obj.applyFilters();
  canvas.renderAll();
}

// Varsayılan export applyBrightness
export default applyBrightness;