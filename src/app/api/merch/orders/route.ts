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

    const cleanCustomerName = String(customerName).replace(/<[^>]*>/g, '').trim().slice(0, 100);
    const cleanCustomerContact = String(customerContact).replace(/<[^>]*>/g, '').trim().slice(0, 50);
    const cleanShippingAddress = String(shippingAddress).replace(/<[^>]*>/g, '').trim().slice(0, 500);
    const cleanCity = String(city || 'Indonesia').replace(/<[^>]*>/g, '').trim().slice(0, 100);

    const newOrder = db.createOrder({
      merchId: String(merchId).slice(0, 80),
      merchName: String(merchName || 'Merch Item').slice(0, 150),
      merchImage: String(merchImage || '').slice(0, 500),
      animeTitle: String(animeTitle || 'Anime Home Merch').slice(0, 150),
      customerName: cleanCustomerName,
      customerContact: cleanCustomerContact,
      shippingAddress: cleanShippingAddress,
      city: cleanCity,
      selectedVariant: String(selectedVariant || 'Standar').slice(0, 50),
      quantity,
      totalAmount: totalAmount || 0,
      costAmount,
      profitAmount: profitAmount || (totalAmount - costAmount),
      paymentMethod: 'qris',
      paymentStatus: body.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      shippingStatus: body.paymentStatus === 'paid' ? 'processing' : 'pending',
      trackingNumber: `AH-DROPSHIP-${Math.floor(100000 + Math.random() * 900000)}`,
      supplierUrl: body.supplierUrl || undefined,
    });

    const sessionKey = `session-${customerContact.replace(/[^0-9]/g, '') || Date.now()}`;
    
    if (newOrder.paymentStatus === 'paid') {
      db.sendChatMessage({
        sessionId: sessionKey,
        sender: 'admin',
        senderName: 'Anime Home Store',
        message: `Terima kasih kak ${customerName}! Pesanan #${newOrder.id.slice(-6)} untuk "${merchName}" (Varian: ${selectedVariant}) telah kami terima dan diverifikasi LUNAS (QRIS GoPay). Pesanan akan segera diproses pengiriman ke ${shippingAddress}, ${city} atas nama "Anime Home Store". No Resi: ${newOrder.trackingNumber}.`,
        merchRef: {
          id: merchId,
          name: merchName,
          imageUrl: merchImage,
          price: totalAmount,
        },
      });
    } else {
      db.sendChatMessage({
        sessionId: sessionKey,
        sender: 'admin',
        senderName: 'Anime Home Store (Billing)',
        message: `Halo kak ${customerName}! Tagihan QRIS GoPay untuk pesanan #${newOrder.id.slice(-6)} ("${merchName}", Varian: ${selectedVariant}) sebesar Rp ${(totalAmount || 0).toLocaleString('id-ID')} telah diterbitkan. Silakan selesaikan pembayaran scan QRIS untuk konfirmasi otomatis.`,
        merchRef: {
          id: merchId,
          name: merchName,
          imageUrl: merchImage,
          price: totalAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: newOrder.paymentStatus === 'paid' ? 'Pesanan berhasil dibuat & lunas!' : 'Pesanan berhasil dibuat, menunggu pembayaran QRIS.',
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
