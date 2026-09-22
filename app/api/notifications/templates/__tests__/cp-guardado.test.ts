import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Base de datos en memoria: el test nunca toca data/templates.json
let mockDb: Array<Record<string, string>> = [];
const writeSpy = vi.fn();

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const isDb = (p: unknown) => typeof p === 'string' && p.endsWith('templates.json');
  // La ruta usa `import fs from 'fs'` (default export): hay que mockear también `default`,
  // si no, el test lee y escribe el data/templates.json real.
  const overrides = {
    existsSync: (p: string) => (isDb(p) ? true : actual.existsSync(p)),
    readFileSync: ((p: string, o?: BufferEncoding) =>
      isDb(p) ? JSON.stringify(mockDb) : actual.readFileSync(p, o)) as typeof actual.readFileSync,
    writeFileSync: ((p: string, c: string, o?: BufferEncoding) => {
      if (isDb(p)) { writeSpy(c); mockDb = JSON.parse(c); return; }
      return actual.writeFileSync(p, c, o);
    }) as typeof actual.writeFileSync,
  };
  return { ...actual, ...overrides, default: { ...actual, ...overrides } };
});

import { POST } from '../route';

const post = (body: object) =>
  POST(new NextRequest('http://localhost/api/notifications/templates', {
    method: 'POST',
    body: JSON.stringify(body),
  }));

beforeEach(() => {
  writeSpy.mockClear();
  mockDb = [{
    id: 'cancellation',
    name: 'Cancelación de Cita',
    subject: 'Cita cancelada - {{fecha}}',
    preheader: '',
    html: '<p>Hola {{nombre}}</p>',
    status: 'active',
    lastModified: '2026-06-20T18:00:00.000Z',
    lastModifiedBy: 'System',
  }];
});

describe('CP-013 / CP-014 – Guardado de plantilla (US-01, US-03 · M06-F01)', () => {
  it('CP-013 (positivo): guarda la plantilla y actualiza "Última modificación"', async () => {
    const res = await post({
      id: 'cancellation',
      subject: 'Tu cita del {{fecha}} fue cancelada',
      html: '<p>Hola {{nombre}}, tu cita fue cancelada.</p>',
      lastModifiedBy: 'Sol',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subject).toBe('Tu cita del {{fecha}} fue cancelada');
    expect(data.lastModifiedBy).toBe('Sol');
    expect(new Date(data.lastModified).getTime())
      .toBeGreaterThan(new Date('2026-06-20T18:00:00.000Z').getTime());
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it('CP-014 (negativo): rechaza guardar una plantilla inexistente y no modifica la base', async () => {
    const antes = JSON.stringify(mockDb);

    const res = await post({
      id: 'plantilla-inexistente',
      subject: 'Asunto válido',
      html: '<p>Cuerpo válido</p>',
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Plantilla no encontrada');
    expect(writeSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(mockDb)).toBe(antes);
  });
});
