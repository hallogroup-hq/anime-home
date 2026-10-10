import { NextResponse } from 'next/server';
import { db } from '@/lib/services/store';

export async function GET() {
  const sessions = db.getAllChatSessions();
  return NextResponse.json({ sessions });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    db.markChatSessionAsRead(sessionId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
