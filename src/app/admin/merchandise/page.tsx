'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/services/store';
import { MerchItem, MerchOrder } from '@/types';
import { 
  ShoppingBag, Plus, DollarSign, Package, Check, 
  TrendingUp, RefreshCw, X, Send, MessageCircle, ExternalLink, Loader2
} from 'lucide-react';

export default function AdminMerchandisePage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [merchList, setMerchList] = useState<MerchItem[]>([]);
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding product
  const [newTitle, setNewTitle] = useState('');
  const [newAnimeTitle, setNewAnimeTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'apparel' | 'figure' | 'accessory' | 'poster'>('apparel');
  const [newPrice, setNewPrice] = useState(139000);
  const [newCostPrice, setNewCostPrice] = useState(65000);
  const [newSupplier, setNewSupplier] = useState('Bandung DTF Apparel POD');
  const [newSupplierPhone, setNewSupplierPhone] = useState('+6281299887766');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVariants, setNewVariants] = useState('S, M, L, XL, XXL');

  const reloadData = () => {
    setMerchList(db.getAllMerch());
    setOrders(db.getOrders());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.totalAmount, 0);
  const totalProfit = orders.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.profitAmount, 0);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAnimeTitle.trim()) return;

    const newItem: MerchItem = {
      id: `merch-custom-${Date.now()}`,
      name: newTitle.trim(),
      animeId: `anime-${newAnimeTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      animeTitle: newAnimeTitle.trim(),
      price: Number(newPrice),
      costPrice: Number(newCostPrice),
      currency: 'IDR',
      category: newCategory,
      imageUrl: newImageUrl.trim() || '/merch/conan-tshirt.jpg',
      storeName: 'Anime Home Store',
      destinationUrl: '#checkout',
      isAffiliate: false,
      verificationState: 'verified',
      supplierName: newSupplier.trim(),
      supplierPhone: newSupplierPhone.trim(),
      stockStatus: 'in_stock',
      variants: newVariants.split(',').map(s => s.trim()).filter(Boolean),
    };

    db.addMerch(newItem);
    reloadData();
    setShowAddModal(false);
    setNewTitle('');
    setNewAnimeTitle('');
    setNewImageUrl('');
  };

  const handleDispatchToSupplier = async (orderId: string) => {
    setDispatchingId(orderId);
    setDispatchNotice('');
    try {
      const res = await fetch('/api/dropship/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setDispatchNotice(data.message || 'Pesanan berhasil diteruskan ke supplier!');
        reloadData();
      } else {
        alert(data.error || 'Gagal meneruskan ke supplier');
      }
    } catch (err: any) {
      alert(err.message || 'Error koneksi');
    } finally {
      setDispatchingId(null);
    }
  };

  const handleUpdateShipping = async (orderId: string, status: 'processing' | 'shipped', tracking?: string) => {
    await fetch('/api/merch/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        shippingStatus: status,
        trackingNumber: tracking,
      }),
    });
    reloadData();
  };

  const generateWhatsAppLink = (order: MerchOrder) => {
    const text = `Halo, order dropship dari *Anime Home Store*:
- No. Ref: #${order.id.slice(-6)}
- Produk: ${order.merchName}
- Varian: ${order.selectedVariant}
- Penerima: ${order.customerName} (${order.customerContact})
- Alamat: ${order.shippingAddress}, ${order.city}
- Pengirim: Anime Home Store (White-Label Packaging)
Mohon diproses dan kirimkan nomor resinya. Terima kasih!`;
    const cleanPhone = '6281299887766';
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-red-600" />
            <span>Dropship & Merchandise Store</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Katalog produk anime, kalkulasi profit bersih, dan otomasi pemesanan ke supplier atas nama Anime Home Store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-red-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Dropship</span>
          </button>
        </div>
      </div>

      {dispatchNotice && (
        <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white flex items-center justify-between">
          <span>{dispatchNotice}</span>
          <button onClick={() => setDispatchNotice('')} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Total Omset (QRIS Lunas)
            </span>
            <div className="text-xl font-bold text-white">{formatRupiah(totalRevenue)}</div>
            <span className="text-[10px] text-zinc-500">Dari {orders.length} pesanan terverifikasi</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800 text-white border border-zinc-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Laba Bersih (Net Profit)
            </span>
            <div className="text-xl font-bold text-white">{formatRupiah(totalProfit)}</div>
            <span className="text-[10px] text-zinc-500">Rata-rata margin ~50% per item</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800 text-white border border-zinc-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Total Produk Aktif
            </span>
            <div className="text-xl font-bold text-white">{merchList.length} Produk</div>
            <span className="text-[10px] text-zinc-500">Apparel, Action Figure, Aksesoris</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800 text-white border border-zinc-700">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Katalog Produk Dropship ({merchList.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <span>Daftar Pesanan Masuk</span>
          <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded text-[10px]">
            {orders.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Produk & Seri</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Modal Supplier</th>
                  <th className="py-3 px-4">Profit Bersih</th>
                  <th className="py-3 px-4">Supplier Mitra</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {merchList.map((item) => {
                  const cost = item.costPrice || Math.round(item.price * 0.5);
                  const profit = item.price - cost;
                  const marginPct = Math.round((profit / item.price) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-800 border border-zinc-800 shrink-0" 
                        />
                        <div className="min-w-0 max-w-xs">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block truncate">
                            {item.animeTitle}
                          </span>
                          <span className="font-semibold text-white block truncate">{item.name}</span>
                          <span className="text-[10px] text-zinc-500 block truncate">
                            Varian: {item.variants ? item.variants.join(', ') : 'Standar'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 border border-zinc-700 uppercase">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatRupiah(item.price)}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {formatRupiah(cost)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">+{formatRupiah(profit)}</div>
                        <span className="text-[10px] text-zinc-400 font-medium">{marginPct}% Margin</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 max-w-[180px] truncate">
                        {item.supplierName || 'Bandung DTF Apparel POD'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.stockStatus || 'in_stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800">
              Belum ada pesanan masuk saat ini.
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Order ID & Waktu</th>
                      <th className="py-3 px-4">Penerima & Alamat</th>
                      <th className="py-3 px-4">Item & Varian</th>
                      <th className="py-3 px-4">Tagihan & Profit</th>
                      <th className="py-3 px-4">Status Bayar</th>
                      <th className="py-3 px-4">Status Dropship</th>
                      <th className="py-3 px-4">Aksi Otomasi Dropship</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {orders.map((order) => {
                      const isDispatched = order.dropshipStatus === 'dispatched_to_supplier' || order.dropshipStatus === 'shipped';
                      return (
                        <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white block">#{order.id.slice(-6)}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <span className="font-semibold text-white block">{order.customerName}</span>
                            <span className="text-[10px] text-zinc-400 block font-mono">{order.customerContact}</span>
                            <span className="text-[11px] text-zinc-400 block truncate">{order.shippingAddress}, {order.city}</span>
                          </td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <img src={order.merchImage} alt="" className="w-8 h-8 rounded object-cover border border-zinc-800 shrink-0" />
                            <div className="truncate max-w-[160px]">
                              <span className="font-medium text-white block truncate">{order.merchName}</span>
                              <span className="text-[10px] text-zinc-400">Varian: {order.selectedVariant}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white block">{formatRupiah(order.totalAmount)}</span>
                            <span className="text-[10px] text-zinc-400 block">Profit: +{formatRupiah(order.profitAmount)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-white border border-zinc-700 uppercase">
                              {order.paymentStatus} (QRIS)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase inline-block ${
                                isDispatched 
                                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' 
                                  : 'bg-red-950/40 text-red-300 border border-red-800/40'
                              }`}>
                                {order.dropshipStatus || 'pending_dispatch'}
                              </span>
                              {order.supplierOrderId && (
                                <span className="font-mono text-[9px] text-zinc-400 block">
                                  Ref: {order.supplierOrderId}
                                </span>
                              )}
                              {order.trackingNumber && (
                                <span className="font-mono text-[9px] text-zinc-300 block">
                                  Resi: {order.trackingNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1.5">
                              {/* 1-Click Push to Supplier API */}
                              {!isDispatched && (
                                <button
                                  type="button"
                                  disabled={dispatchingId === order.id}
                                  onClick={() => handleDispatchToSupplier(order.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {dispatchingId === order.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Meneruskan...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      <span>Push ke Supplier (1-Click)</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* WhatsApp Deep-link */}
                              <a
                                href={generateWhatsAppLink(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3 text-zinc-400" />
                                <span>Kirim WA Supplier</span>
                              </a>

                              {/* Resi updater */}
                              {order.shippingStatus !== 'shipped' && (
                                <button
                                  onClick={() => handleUpdateShipping(order.id, 'shipped', order.trackingNumber || `AH-REG-${Date.now().toString().slice(-6)}`)}
                                  className="text-[9px] text-zinc-400 hover:text-white underline text-left"
                                >
                                  Tandai Resi Terbit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Produk */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>Tambah Produk Dropship Baru</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nama Produk Merchandise</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Kaos Oversize Detective Conan Shadow"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Judul Anime</label>
                  <input
                    type="text"
                    required
                    value={newAnimeTitle}
                    onChange={(e) => setNewAnimeTitle(e.target.value)}
                    placeholder="Contoh: Detective Conan"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  >
                    <option value="apparel">Apparel / Kaos / Hoodie</option>
                    <option value="figure">Action Figure / Nendoroid</option>
                    <option value="accessory">Aksesoris / Ganci</option>
                    <option value="poster">Poster / Wall Decor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Harga Jual (IDR)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Modal Supplier (IDR)</label>
                  <input
                    type="number"
                    required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Nama Supplier / Vendor</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    placeholder="Contoh: Bandung DTF Apparel"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">WhatsApp Supplier</label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="+6281299887766"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">URL Gambar Produk</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="/merch/conan-tshirt.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Pilihan Varian (Pisahkan koma)</label>
                <input
                  type="text"
                  value={newVariants}
                  onChange={(e) => setNewVariants(e.target.value)}
                  placeholder="S, M, L, XL, XXL"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
