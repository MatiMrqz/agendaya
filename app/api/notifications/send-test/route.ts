import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const mockVariables: Record<string, string> = {
  nombre: 'Juan Pérez',
  fecha: '2026-06-25',
  hora: '15:30',
  enlace: 'https://agendaya.app/citas/test-123'
};

export function interpolateVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateId, subject, html, preheader } = body;

    if (!to || to.trim() === '') {
      return NextResponse.json({ error: 'La dirección de correo de destino es obligatoria' }, { status: 400 });
    }

    if (!templateId || templateId.trim() === '') {
      return NextResponse.json({ error: 'El identificador de plantilla es obligatorio' }, { status: 400 });
    }

    // Replace variables with mock data in subject, html and preheader
    const finalSubject = interpolateVariables(subject || '', mockVariables);
    const finalPreheader = interpolateVariables(preheader || '', mockVariables);
    const finalHtml = interpolateVariables(html || '', mockVariables);

    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: 'AgendaYA <onboarding@resend.dev>',
        to,
        subject: finalSubject,
        html: finalHtml,
        headers: finalPreheader ? { 'X-Entity-Ref-ID': finalPreheader } : undefined
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, emailId: data?.id });
    } else {
      // Fallback Console Simulation
      console.log('--- [SIMULATION] Sending Email ---');
      console.log('To:', to);
      console.log('Subject:', finalSubject);
      console.log('Preheader:', finalPreheader);
      console.log('Body HTML:\n', finalHtml);
      console.log('----------------------------------');

      return NextResponse.json({ success: true, simulated: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
