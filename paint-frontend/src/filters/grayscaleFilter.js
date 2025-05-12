import { filters as FabricFilters } from 'fabric';
const { Grayscale } = FabricFilters;

export function applyGrayscale(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') {
    console.warn('Lütfen önce bir resmi seçin.');
    return;
  }
  // Sadece eski Grayscale filtrelerini çıkar, diğer filtreleri koru
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
