// mm başına inç (milimetre ↔ px dönüşümleri için)
export const mmPerInch = 25.4;

/**
 * Cihaz DPI’sını alır (veya sabit döndürür).
 * Burada basitçe 96*devicePixelRatio kullanıyoruz.
 */
export function getDPI() {
  return window.devicePixelRatio * 96;
}
