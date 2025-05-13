// src/filters/blurFilter.js
import { filters as FabricFilters } from 'fabric';
const { Convolute } = FabricFilters;

/**
 * Uygular: mevcut Convolute (blur) filtrelerini kaldırır, yeni bir Gaussian Blur ekler.
 * @param {fabric.Canvas} canvas 
 */
export function applyBlur(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resim seçin.');
    return;
  }
  // Gaussian 3x3 kernel (1/16 * [1 2 1; 2 4 2; 1 2 1])
  const kernel = [
    1 / 16, 2 / 16, 1 / 16,
    2 / 16, 4 / 16, 2 / 16,
    1 / 16, 2 / 16, 1 / 16,
  ];
  // Önce eski blur (Convolute) filtrelerini temizle
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Convolute));
  // Yeni Gaussian blur filtreyi ekle
  obj.filters.push(new Convolute({ matrix: kernel, opaque: false }));
  obj.applyFilters();
  canvas.renderAll();
}

/**
 * Geri alır: sadece Convolute filtrelerini kaldırır.
 * @param {fabric.Canvas} canvas 
 */
export function removeBlur(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof Convolute));
  obj.applyFilters();
  canvas.renderAll();
}

export default applyBlur;
