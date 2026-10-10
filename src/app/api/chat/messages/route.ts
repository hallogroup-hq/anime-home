import { NextResponse } from 'next/server';
import { db } from '@/lib/services/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const messages = db.getChatMessages(sessionId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, sender, senderName, message, merchRef } = body;

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 });
    }

    const created = db.sendChatMessage({
      sessionId,
      sender: sender || 'customer',
      senderName: senderName || (sender === 'admin' ? 'Anime Home Support' : 'Pengunjung'),
      message,
      merchRef,
    });

    return NextResponse.json({ success: true, message: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
