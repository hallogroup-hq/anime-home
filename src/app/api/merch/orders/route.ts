import { NextResponse } from 'next/server';
import { db } from '@/lib/services/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('id');

  if (orderId) {
    const order = db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order });
  }

  const orders = db.getOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      merchId,
      merchName,
      merchImage,
      animeTitle,
      customerName,
      customerContact,
      shippingAddress,
      city,
      selectedVariant,
      quantity = 1,
      totalAmount,
      costAmount = 0,
      profitAmount = 0,
    } = body;

    if (!merchId || !customerName || !customerContact || !shippingAddress) {
      return NextResponse.json({ error: 'Data pemesanan tidak lengkap' }, { status: 400 });
    }

    const newOrder = db.createOrder({
      merchId,
      merchName,
      merchImage,
      animeTitle: animeTitle || 'Anime Home Merch',
      customerName,
      customerContact,
      shippingAddress,
      city: city || 'Indonesia',
      selectedVariant: selectedVariant || 'Standar',
      quantity,
      totalAmount: totalAmount || 0,
      costAmount,
      profitAmount: profitAmount || (totalAmount - costAmount),
      paymentMethod: 'qris',
      paymentStatus: 'paid', // Instant auto-confirmation for simulation / QRIS scan
      shippingStatus: 'processing',
      trackingNumber: `AH-DROPSHIP-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    // Also auto-create a chat message receipt in live chat for the customer
    const sessionKey = `session-${customerContact.replace(/[^0-9]/g, '') || Date.now()}`;
    db.sendChatMessage({
      sessionId: sessionKey,
      sender: 'admin',
      senderName: 'Anime Home Store',
      message: `Terima kasih kak ${customerName}! Pesanan #${newOrder.id.slice(-6)} untuk "${merchName}" (Varian: ${selectedVariant}) telah kami terima dan diverifikasi LUNAS (QRIS). Pesanan akan segera diproses pengiriman ke ${shippingAddress}, ${city} atas nama "Anime Home Store". No Resi: ${newOrder.trackingNumber}.`,
      merchRef: {
        id: merchId,
        name: merchName,
        imageUrl: merchImage,
        price: totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat & diverifikasi lunas!',
      order: newOrder,
      sessionKey,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentStatus, shippingStatus, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updated = db.updateOrderStatus(orderId, {
      paymentStatus,
      shippingStatus,
      trackingNumber,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
