// src/filters/thresholdFilter.js
import { filters as FabricFilters } from 'fabric';
const { BaseFilter } = FabricFilters;

/**
 * Eşikleme filtresi: pixel değerlerini threshold eşiğine göre siyah/beyaza çevirir.
 */
class ThresholdFilter extends BaseFilter {
  /**
   * @param {Object} options
   * @param {number} options.threshold - 0.0 ile 1.0 arası eşik değeri
   */
  constructor({ threshold = 0.5 } = {}) {
    super();
    this.threshold = typeof threshold === 'number' ? threshold : 0.5;
    this.type = 'ThresholdFilter';
  }

  /**
   * 2D filter pipeline desteği
   * @param {Object} options - T2DPipelineState
   * @param {ImageData} options.imageData - üzerinde çalışılacak görüntü verisi
   * @param {Function} options.putImageData - sonuçları yazmak için callback
   */
  applyTo2d({ imageData, putImageData }) {
    const data = imageData.data;
    const t = this.threshold * 255;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const v = avg < t ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
    }
    putImageData(imageData);
  }

  /**
   * Serileştirme desteği
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

// Filtreyi Fabric koleksiyonuna ekle (readonly olabilir)
try { FabricFilters.ThresholdFilter = ThresholdFilter; } catch (e) {}

/**
 * Aktif nesneye yeni ThresholdFilter ekler
 * @param {fabric.Canvas} canvas
 * @param {number} value - 0.0 ile 1.0 arası eşik değeri
 */
export default function applyThreshold(canvas, value = 0.5) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof ThresholdFilter));
  obj.filters.push(new ThresholdFilter({ threshold: value }));
  obj.applyFilters();
  canvas.requestRenderAll();
}

/**
 * ThresholdFilter kaldırır
 * @param {fabric.Canvas} canvas
 */
export function removeThreshold(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') return;
  obj.filters = (obj.filters || []).filter(f => !(f instanceof ThresholdFilter));
  obj.applyFilters();
  canvas.requestRenderAll();
}
