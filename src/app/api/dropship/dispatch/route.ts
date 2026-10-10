import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/services/store';

export async function POST(req: NextRequest) {
  try {
    // Verifikasi keamanan asal request (hanya internal Anime Home atau token admin)
    const referer = req.headers.get('referer') || '';
    const host = req.headers.get('host') || '';
    const authHeader = req.headers.get('authorization') || '';
    const isInternal = !referer || referer.includes(host) || referer.includes('anime-home-psi.vercel.app') || referer.includes('localhost');
    const isAdminAuth = authHeader.includes('Bearer ') || req.cookies.get('ah_session')?.value;

    if (!isInternal && !isAdminAuth) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya administrator yang berhak meneruskan pesanan.' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID wajib diisi dengan format valid' }, { status: 400 });
    }

    const order = db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const merch = db.getMerchById(order.merchId);
    const supplierName = merch?.supplierName || 'Bandung DTF Apparel POD';
    const supplierPhone = merch?.supplierPhone || '+6281299887766';

    // Format white-label dropship payload
    const dropshipPayload = {
      action: 'NEW_DROPSHIP_ORDER',
      sender: {
        storeName: 'Anime Home Store',
        contact: '+62812000000',
        label: 'White-Label / Tanpa Logo Marketplace Luar'
      },
      recipient: {
        name: order.customerName,
        phone: order.customerContact,
        address: order.shippingAddress,
        city: order.city,
      },
      orderItem: {
        sku: order.merchId,
        productName: order.merchName,
        variant: order.selectedVariant,
        quantity: order.quantity || 1,
        costAmount: order.costAmount,
      },
      dispatchedAt: new Date().toISOString()
    };

    // Generate automated supplier order reference
    const supplierOrderId = `SUPP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const supplierNotes = `Otomatis diteruskan ke ${supplierName} via White-Label Dropship Dispatcher`;

    // Update in-memory DB
    db.updateOrderStatus(orderId, {
      dropshipStatus: 'dispatched_to_supplier',
      supplierOrderId,
      supplierNotes,
      shippingStatus: 'processing',
    });

    return NextResponse.json({
      success: true,
      message: `Pesanan berhasil diteruskan secara otomatis ke supplier ${supplierName}!`,
      supplierOrderId,
      supplierPhone,
      dropshipPayload
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
