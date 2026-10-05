/**
 * Valida si un string de HTML contiene contenido renderizable (texto visible o elementos visuales).
 * Evita que etiquetas HTML vacías como `<p></p>`, `<div><span></span></div>`,
 * `<p><br></p>` o espacios en blanco sean considerados válidos.
 */
export function hasRenderableContent(html?: string | null): boolean {
  if (!html || typeof html !== 'string') return false;

  // Elimina comentarios HTML
  let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');

  // Elimina secciones no visibles: <head>, <style>, <script>
  cleaned = cleaned.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Elementos que producen renderizado visual por sí mismos (ej. imágenes, líneas, svgs, media)
  if (/<(img|svg|hr|video|iframe|canvas|audio)\b[^>]*>/i.test(cleaned)) {
    return true;
  }

  // Elimina todas las etiquetas HTML restantes
  const textContent = cleaned
    .replace(/<[^>]+>/g, '')
    // Reemplaza entidades de espacio en blanco y espacios de ancho cero
    .replace(/&nbsp;|&#160;|&ensp;|&emsp;|&thinsp;|&ZeroWidthSpace;/gi, ' ')
    .replace(/[\s\u200B\uFEFF]/g, ' ')
    .trim();

  return textContent.length > 0;
}
