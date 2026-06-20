import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

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
