import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock fs module for memory database
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  let mockDb = [
    {
      id: 'new-booking',
      name: 'Nueva Reserva',
      subject: '¡Nueva reserva!',
      preheader: 'Preheader',
      html: '<p>Body</p>',
      status: 'active',
      lastModified: '2026-06-20T18:00:00.000Z',
      lastModifiedBy: 'System'
    },
    {
      id: 'cancellation',
      name: 'Cancelación de Cita',
      subject: 'Cita cancelada',
      preheader: 'Preheader',
      html: '<p>Body</p>',
      status: 'active',
      lastModified: '2026-06-20T18:00:00.000Z',
      lastModifiedBy: 'System'
    },
    {
      id: 'confirmation',
      name: 'Confirmación de Cita',
      subject: 'Cita confirmada',
      preheader: 'Preheader',
      html: '<p>Body</p>',
      status: 'active',
      lastModified: '2026-06-20T18:00:00.000Z',
      lastModifiedBy: 'System'
    }
  ];
  return {
    ...actual,
    existsSync: (filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('templates.json')) return true;
      return actual.existsSync(filePath);
    },
    readFileSync: (filePath: string, options?: unknown) => {
      if (typeof filePath === 'string' && filePath.endsWith('templates.json')) {
        return JSON.stringify(mockDb);
      }
      const read = (actual as { readFileSync: (path: string, options?: unknown) => string | Buffer }).readFileSync;
      return read(filePath, options);
    },
    writeFileSync: (filePath: string, content: string, options?: unknown) => {
      if (typeof filePath === 'string' && filePath.endsWith('templates.json')) {
        mockDb = JSON.parse(content);
        return;
      }
      const write = (actual as { writeFileSync: (path: string, content: string, options?: unknown) => void }).writeFileSync;
      return write(filePath, content, options);
    }
  };
});

describe('GET /api/notifications/templates', () => {
  it('returns all templates from the JSON database', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(3);
    expect(data[0].id).toBe('new-booking');
  });
});

describe('POST /api/notifications/templates', () => {
  it('saves an updated template and returns it', async () => {
    const updatePayload = {
      id: 'new-booking',
      subject: 'Updated Booking Subject',
      html: '<p>Updated Body</p>',
      status: 'active',
      lastModifiedBy: 'Test Admin'
    };

    const req = new NextRequest('http://localhost/api/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(updatePayload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subject).toBe('Updated Booking Subject');
  });

  it('fails if subject is missing', async () => {
    const badPayload = {
      id: 'new-booking',
      html: '<p>Body</p>',
      status: 'active',
      lastModifiedBy: 'Test Admin'
    };

    const req = new NextRequest('http://localhost/api/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(badPayload)
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El asunto es obligatorio');
  });

  it('fails if html is missing', async () => {
    const badPayload = {
      id: 'new-booking',
      subject: 'Subject',
      status: 'active',
      lastModifiedBy: 'Test Admin'
    };

    const req = new NextRequest('http://localhost/api/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(badPayload)
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El cuerpo de la plantilla es obligatorio');
  });
});
