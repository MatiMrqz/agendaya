import { describe, it, expect } from 'vitest';
import { hasRenderableContent } from '../html-utils';

describe('hasRenderableContent', () => {
  it('returns false for empty, null, or undefined values', () => {
    expect(hasRenderableContent('')).toBe(false);
    expect(hasRenderableContent('   ')).toBe(false);
    expect(hasRenderableContent(null)).toBe(false);
    expect(hasRenderableContent(undefined)).toBe(false);
  });

  it('returns false for empty html tags like <p></p>', () => {
    expect(hasRenderableContent('<p></p>')).toBe(false);
    expect(hasRenderableContent('<p>   </p>')).toBe(false);
    expect(hasRenderableContent('<div><span></span></div>')).toBe(false);
    expect(hasRenderableContent('<p class="text"></p>')).toBe(false);
    expect(hasRenderableContent('<div style="color:red"></div>')).toBe(false);
  });

  it('returns false for tags containing only break lines, comments, or non-breaking spaces', () => {
    expect(hasRenderableContent('<p><br></p>')).toBe(false);
    expect(hasRenderableContent('<p><br/></p>')).toBe(false);
    expect(hasRenderableContent('<br>')).toBe(false);
    expect(hasRenderableContent('<p>&nbsp;</p>')).toBe(false);
    expect(hasRenderableContent('<p>&#160;</p>')).toBe(false);
    expect(hasRenderableContent('<!-- solo un comentario -->')).toBe(false);
    expect(hasRenderableContent('<p><!-- comentario dentro de p --></p>')).toBe(false);
  });

  it('returns false for HTML document shell with empty body', () => {
    const emptyDoc = '<!DOCTYPE html><html><head><style>body { color: red; }</style></head><body><p></p></body></html>';
    expect(hasRenderableContent(emptyDoc)).toBe(false);
  });

  it('returns true when there is visible text', () => {
    expect(hasRenderableContent('<p>Hola mundo</p>')).toBe(true);
    expect(hasRenderableContent('<p>Hola {{nombre}}</p>')).toBe(true);
    expect(hasRenderableContent('Texto plano sin etiquetas')).toBe(true);
    expect(hasRenderableContent('<div><p><span>Contenido anidado</span></p></div>')).toBe(true);
  });

  it('returns true for visual elements like images, horizontal rules, or SVGs', () => {
    expect(hasRenderableContent('<img src="https://example.com/logo.png" alt="Logo" />')).toBe(true);
    expect(hasRenderableContent('<div><img src="banner.jpg"></div>')).toBe(true);
    expect(hasRenderableContent('<hr>')).toBe(true);
    expect(hasRenderableContent('<svg><circle cx="50" cy="50" r="40" /></svg>')).toBe(true);
  });
});
