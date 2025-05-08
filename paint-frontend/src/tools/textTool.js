// src/tools/textTool.js
import { IText } from 'fabric';

/**
 * Metin (text) aracını başlatır.
 * - Var olan bir IText nesnesine tıklarsanız, düzenleme moduna girer.
 * - Aksi halde yeni bir IText ekler ve hemen düzenleme moduna alır.
 *
 * @param {fabric.Canvas} canvas
 * @param {Object} options
 * @param {string} options.text - Yeni eklenen metin için başlangıç içeriği.
 * @param {number} options.fontSize
 * @param {string} options.fontFamily
 * @param {string} options.color
 * @returns {Function} cleanup
 */
export function initTextTool(canvas, options) {
  const {
    text = 'Text',
    fontSize = 20,
    fontFamily = 'Arial',
    color = '#000000'
  } = options;

  // İmleci metin düzenleme moduna uygun hale getir
  canvas.defaultCursor = 'text';

  const onMouseDown = opt => {
    const pointer = canvas.getPointer(opt.e);
    const target  = opt.target;

    // Mevcut IText nesnesine tıklanmışsa düzenle
    if (target?.isType?.('i-text')) {
      canvas.setActiveObject(target);
      target.enterEditing();
      target.selectAll();
      return;
    }

    // Yeni IText oluştur ve düzenleme moduna geç
    const iText = new IText(text, {
      left:       pointer.x,
      top:        pointer.y,
      fill:       color,
      fontSize,
      fontFamily,
      selectable: true
    });
    canvas.add(iText);
    canvas.setActiveObject(iText);
    iText.enterEditing();
    iText.selectAll();
    canvas.renderAll();
  };

  canvas.on('mouse:down', onMouseDown);
  return () => {
    canvas.off('mouse:down', onMouseDown);
  };
}
