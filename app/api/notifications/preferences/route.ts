import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/notification-preferences.json');

const DEFAULT_PREFERENCES = {
  newBooking: true,
  cancellation: true,
};

function readPreferences() {
  if (!fs.existsSync(DB_PATH)) {
    return { ...DEFAULT_PREFERENCES };
  }
  const content = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(content);
}

function writePreferences(data: unknown) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  try {
    const preferences = readPreferences();
    return NextResponse.json(preferences);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newBooking, cancellation, reset } = body;

    if (reset === true) {
      writePreferences(DEFAULT_PREFERENCES);
      return NextResponse.json(DEFAULT_PREFERENCES);
    }

    if (typeof newBooking !== 'boolean' || typeof cancellation !== 'boolean') {
      return NextResponse.json(
        { error: 'Las preferencias deben ser valores booleanos' },
        { status: 400 }
      );
    }

    const preferences = { newBooking, cancellation };
    writePreferences(preferences);

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
