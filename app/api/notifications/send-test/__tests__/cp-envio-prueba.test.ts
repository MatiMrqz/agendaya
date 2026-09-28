import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// CP-015 / CP-016 se ejecutan en modo simulado: sin RESEND_API_KEY no se envía ningún correo real.
const post = (body: object) =>
  POST(new NextRequest('http://localhost/api/notifications/send-test', {
    method: 'POST',
    body: JSON.stringify(body),
  }));

const datosBase = {
  templateId: 'new-booking',
  subject: 'Nueva reserva confirmada - {{fecha}}',
  preheader: 'Tu reserva para el {{fecha}} fue registrada.',
  html: '<p>Hola, {{nombre}}.</p><p>Registramos tu reserva para el día {{fecha}} a las {{hora}}.</p>',
};

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('CP-015 / CP-016 – Envío de correo de prueba (US-04, US-05 · M06-F01)', () => {
  it('CP-015 (positivo): envía el correo de prueba con las variables reemplazadas por datos ficticios', async () => {
    const res = await post({ ...datosBase, to: 'admin.agendaya@example.com' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, simulated: true });

    const salida = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(salida).toContain('To: admin.agendaya@example.com');
    expect(salida).toContain('Subject: Nueva reserva confirmada - 2026-06-25');
    expect(salida).toContain('Registramos tu reserva para el día 2026-06-25 a las 15:30.');
    expect(salida).not.toContain('{{');
  });

  it('CP-016 (negativo): rechaza un destinatario sin formato de correo y no envía nada', async () => {
    const res = await post({ ...datosBase, to: 'admin.agendaya' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'El formato del correo de destino no es válido' });

    const salida = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(salida).not.toContain('[SIMULATION]');
  });
});
