import { Image as FabricImage } from 'fabric';

const backupMap = new WeakMap();

/**
 * Gerçek kırpma: seçilen dikdörtgeni alt-resim olarak oluşturur.
 *
 * @param {fabric.Canvas} canvas
 * @param {{ left: number, top: number, width: number, height: number }} rect
 */
export function applyCrop(canvas, rect) {
  const imgObj = canvas.getActiveObject();
  if (!imgObj || imgObj.type !== 'image') {
    console.warn('Lütfen önce bir resim seçin.');
    return;
  }

  // Orijinali yedekle (tek seferlik)
  if (!backupMap.has(imgObj)) {
    backupMap.set(imgObj, {
      src: imgObj.getElement().src,
      left: imgObj.left,
      top: imgObj.top,
      scaleX: imgObj.scaleX,
      scaleY: imgObj.scaleY,
      angle: imgObj.angle
    });
  }

  const orig = backupMap.get(imgObj);
  const sourceImg = imgObj.getElement();
  const sx = rect.left - imgObj.left;
  const sy = rect.top - imgObj.top;
  const sw = rect.width;
  const sh = rect.height;

  const tmp = document.createElement('canvas');
  tmp.width = sw;
  tmp.height = sh;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(
    sourceImg,
    sx / imgObj.scaleX,
    sy / imgObj.scaleY,
    sw / imgObj.scaleX,
    sh / imgObj.scaleY,
    0,
    0,
    sw,
    sh
  );

  const dataURL = tmp.toDataURL();

  FabricImage.fromURL(dataURL, (newImg) => {
    newImg.set({
      left: rect.left,
      top: rect.top,
      angle: orig.angle,
      scaleX: 1,
      scaleY: 1,
      originX: 'left',
      originY: 'top'
    });
    canvas.remove(imgObj);
    canvas.add(newImg);
    canvas.setActiveObject(newImg);
    canvas.renderAll();
  });
}

/**
 * Geri al: yedekteki orijinali geri yükler.
 *
 * @param {fabric.Canvas} canvas
 */
export function removeCrop(canvas) {
  const entry = Array.from(canvas.getObjects()).find(o => backupMap.has(o));
  if (!entry) return;

  const orig = backupMap.get(entry);
  FabricImage.fromURL(orig.src, (restored) => {
    restored.set({
      left: orig.left,
      top: orig.top,
      angle: orig.angle,
      scaleX: orig.scaleX,
      scaleY: orig.scaleY,
      originX: 'left',
      originY: 'top'
    });
    canvas.remove(entry);
    canvas.add(restored);
    canvas.setActiveObject(restored);
    canvas.renderAll();
    backupMap.delete(entry);
  });
}

export default applyCrop;
