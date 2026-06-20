import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/templates.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  const content = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(content);
}

function writeDb(data: unknown) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  try {
    const templates = readDb();
    return NextResponse.json(templates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, subject, preheader, html, status, lastModifiedBy } = body;

    if (!subject || subject.trim() === '') {
      return NextResponse.json({ error: 'El asunto es obligatorio' }, { status: 400 });
    }
    if (!html || html.trim() === '') {
      return NextResponse.json({ error: 'El cuerpo de la plantilla es obligatorio' }, { status: 400 });
    }

    const templates = readDb();
    const index = templates.findIndex((t: { id: string }) => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const updatedTemplate = {
      ...templates[index],
      subject,
      preheader: preheader || '',
      html,
      status: status || templates[index].status,
      lastModified: new Date().toISOString(),
      lastModifiedBy: lastModifiedBy || 'Admin'
    };

    templates[index] = updatedTemplate;
    writeDb(templates);

    return NextResponse.json(updatedTemplate);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
