import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock Resend SDK
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null });
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: mockSend
      };
    }
  };
});

describe('POST /api/notifications/send-test', () => {
  beforeEach(() => {
    mockSend.mockClear();
    process.env.RESEND_API_KEY = 're_mockkey123';
  });

  it('replaces template variables with mock data and calls Resend when API key is set', async () => {
    const payload = {
      to: 'client@example.com',
      templateId: 'new-booking',
      subject: 'Reserva para {{nombre}}',
      html: 'Hola {{nombre}}, tu cita es el {{fecha}} a las {{hora}}.',
      preheader: 'Recordatorio'
    };

    const req = new NextRequest('http://localhost/api/notifications/send-test', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.emailId).toBe('test-email-id');

    // Verify Resend was called with interpolated variables
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.to).toBe('client@example.com');
    expect(sendArgs.subject).toContain('Juan Pérez'); // {{nombre}} replaced
    expect(sendArgs.html).toContain('Juan Pérez');
    expect(sendArgs.html).toContain('2026-06-25'); // default mock date
  });

  it('falls back to console log simulation when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const payload = {
      to: 'client@example.com',
      templateId: 'new-booking',
      subject: 'Reserva para {{nombre}}',
      html: 'Hola {{nombre}}, tu cita es.',
      preheader: 'Recordatorio'
    };

    const req = new NextRequest('http://localhost/api/notifications/send-test', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.simulated).toBe(true);

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('fails if target email address (to) is missing', async () => {
    const payload = {
      templateId: 'new-booking',
      subject: 'Reserva para {{nombre}}',
      html: 'Hola {{nombre}}'
    };

    const req = new NextRequest('http://localhost/api/notifications/send-test', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('La dirección de correo de destino es obligatoria');
  });

  it('fails if templateId is missing', async () => {
    const payload = {
      to: 'client@example.com',
      subject: 'Subject',
      html: 'Body'
    };

    const req = new NextRequest('http://localhost/api/notifications/send-test', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El identificador de plantilla es obligatorio');
  });
});
