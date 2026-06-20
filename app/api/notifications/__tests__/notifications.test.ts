import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GET as getTemplates, POST as postTemplate } from '../templates/route';
import { POST as sendTest } from '../send-test/route';

const DB_PATH = path.join(process.cwd(), 'data/templates.json');
let dbBackup: string | null = null;

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

describe('Notifications Module E2E Integration Lifecycle', () => {
  beforeAll(() => {
    // Backup existing templates database
    if (fs.existsSync(DB_PATH)) {
      dbBackup = fs.readFileSync(DB_PATH, 'utf8');
    }
    process.env.RESEND_API_KEY = 're_mock123';
  });

  afterAll(() => {
    // Restore templates database backup
    if (dbBackup !== null) {
      fs.writeFileSync(DB_PATH, dbBackup, 'utf8');
    } else if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  it('completes the full loop: fetch templates -> customize a template -> send test email', async () => {
    // 1. Fetch initial templates
    const getRes = await getTemplates();
    expect(getRes.status).toBe(200);
    const initialTemplates = await getRes.json();
    expect(initialTemplates.length).toBeGreaterThan(0);

    const targetTemplate = initialTemplates[0]; // e.g. new-booking

    // 2. Customize the template
    const customSubject = '¡Hola {{nombre}}! Reserva Confirmada';
    const customHtml = '<p>Tu reserva para el día {{fecha}} está lista.</p>';
    const postReq = new NextRequest('http://localhost/api/notifications/templates', {
      method: 'POST',
      body: JSON.stringify({
        id: targetTemplate.id,
        subject: customSubject,
        html: customHtml,
        status: 'active',
        lastModifiedBy: 'Integration Test'
      })
    });

    const postRes = await postTemplate(postReq);
    expect(postRes.status).toBe(200);
    const updatedTemplate = await postRes.json();
    expect(updatedTemplate.subject).toBe(customSubject);
    expect(updatedTemplate.html).toBe(customHtml);
    expect(updatedTemplate.lastModifiedBy).toBe('Integration Test');

    // 3. Trigger a test email send with this customized template
    const sendReq = new NextRequest('http://localhost/api/notifications/send-test', {
      method: 'POST',
      body: JSON.stringify({
        to: 'recipient@example.com',
        templateId: targetTemplate.id,
        subject: updatedTemplate.subject,
        html: updatedTemplate.html,
        preheader: updatedTemplate.preheader
      })
    });

    const sendRes = await sendTest(sendReq);
    expect(sendRes.status).toBe(200);
    const sendData = await sendRes.json();
    expect(sendData.success).toBe(true);

    // 4. Verify Resend was called with the customized text with replaced variables
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.to).toBe('recipient@example.com');
    expect(sendArgs.subject).toContain('Juan Pérez'); // {{nombre}} resolved
    expect(sendArgs.html).toContain('2026-06-25'); // {{fecha}} resolved
  });
});
