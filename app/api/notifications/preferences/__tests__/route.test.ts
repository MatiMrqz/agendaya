import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

const { getMockDb, setMockDb, resetMockDb } = vi.hoisted(() => {
  let mockDb: string | null = null;
  return {
    getMockDb: () => mockDb,
    setMockDb: (value: string) => { mockDb = value; },
    resetMockDb: () => { mockDb = null; },
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: (filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('notification-preferences.json')) {
        return getMockDb() !== null;
      }
      return actual.existsSync(filePath);
    },
    readFileSync: (filePath: string, options?: unknown) => {
      if (typeof filePath === 'string' && filePath.endsWith('notification-preferences.json')) {
        return getMockDb() || '{}';
      }
      const read = (actual as { readFileSync: (path: string, options?: unknown) => string | Buffer }).readFileSync;
      return read(filePath, options);
    },
    writeFileSync: (filePath: string, content: string, options?: unknown) => {
      if (typeof filePath === 'string' && filePath.endsWith('notification-preferences.json')) {
        setMockDb(content);
        return;
      }
      const write = (actual as { writeFileSync: (path: string, content: string, options?: unknown) => void }).writeFileSync;
      return write(filePath, content, options);
    },
  };
});

beforeEach(() => {
  resetMockDb();
});

describe('GET /api/notifications/preferences', () => {
  it('returns default preferences when no saved file exists', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ newBooking: true, cancellation: true });
  });

  it('returns saved preferences after a previous update', async () => {
    const saveReq = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ newBooking: false, cancellation: true }),
    });
    await POST(saveReq);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newBooking).toBe(false);
    expect(data.cancellation).toBe(true);
  });
});

describe('POST /api/notifications/preferences', () => {
  // US-07 positive
  it('disables booking notification successfully', async () => {
    const req = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ newBooking: false, cancellation: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newBooking).toBe(false);
    expect(data.cancellation).toBe(true);
  });

  // US-07 negative
  it('rejects non-boolean value for newBooking', async () => {
    const req = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ newBooking: 'yes', cancellation: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  // US-08 positive
  it('disables cancellation notification successfully', async () => {
    const req = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ newBooking: true, cancellation: false }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newBooking).toBe(true);
    expect(data.cancellation).toBe(false);
  });

  // US-08 negative
  it('rejects request with missing preference fields', async () => {
    const req = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  // US-09 Scenario 1 positive — reset to defaults
  it('resets preferences to defaults when reset flag is true', async () => {
    // First save non-default preferences
    const saveReq = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ newBooking: false, cancellation: false }),
    });
    await POST(saveReq);

    // Reset
    const resetReq = new NextRequest('http://localhost/api/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ reset: true }),
    });
    const res = await POST(resetReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ newBooking: true, cancellation: true });

    // Verify persistence — GET should also return defaults
    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData).toEqual({ newBooking: true, cancellation: true });
  });
});
