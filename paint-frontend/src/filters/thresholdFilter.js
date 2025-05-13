// src/filters/thresholdFilter.js
import { filters as FabricFilters } from 'fabric';
const { BaseFilter } = FabricFilters;

/**
 * Eşikleme filtresi: piksel değerlerini eşik değerine göre siyah/beyaza çevirir.
 */
export class ThresholdFilter extends BaseFilter {
  // Sınıf ismi (serileştirme için)
  static type = 'ThresholdFilter';

  /**
   * @param {{ threshold?: number }} options
   * @param {number} options.threshold - 0.0 ile 1.0 arası eşik değeri
   */
  constructor({ threshold = 0.5 } = {}) {
    super();
    this.threshold = typeof threshold === 'number' ? threshold : 0.5;
  }

  /**
   * 2D pipeline: sadece imageData üzerinde oynar.
   * @param {Object} options
   * @param {ImageData} options.imageData
   */
  applyTo2d({ imageData }) {
    const data = imageData.data;
    const t = this.threshold * 255;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const v = avg < t ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
    }
    // putImageData çağrısına gerek yok; backend son adımda kendi yapıyor.
  }

  /**
   * Serileştirme için obje döner.
   */
  toObject() {
    return { threshold: this.threshold };
  }

  /**
   * Deserializasyon
   */
  static fromObject({ threshold }) {
    return new ThresholdFilter({ threshold });
  }
}

/**
 * Eşik filtresini aktif nesneye uygular veya günceller.
 * @param {fabric.Canvas} canvas
 * @param {number} value - 0.0 ile 1.0 arası eşik değeri
 */
export function applyThreshold(canvas, value = 0.5) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resim seçin.');
    return;
  }
  obj.filters = (obj.filters || []).filter(f => !(f instanceof ThresholdFilter));
  obj.filters.push(new ThresholdFilter({ threshold: value }));
  obj.applyFilters();
  canvas.renderAll();
}

/**
 * Eşik filtresini aktif nesneden kaldırır.
 * @param {fabric.Canvas} canvas
 */
export function removeThreshold(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof ThresholdFilter));
  obj.applyFilters();
  canvas.renderAll();
}

export default applyThreshold;
