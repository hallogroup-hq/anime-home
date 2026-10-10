'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MerchItem } from '@/types';
import { X, Check, ShoppingBag, MessageSquare, ShieldCheck, Ruler, ArrowRight } from 'lucide-react';

interface ProductDetailModalProps {
  item: MerchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (item: MerchItem, selectedVariant: string) => void;
  onAskCS?: (item: MerchItem) => void;
}

export function ProductDetailModal({
  item,
  isOpen,
  onClose,
  onProceedToCheckout,
  onAskCS,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);

  // Sync default variant when item changes
  React.useEffect(() => {
    if (item?.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant('Default');
    }
    setActiveImageIndex(0);
    setShowSizeChart(false);
  }, [item]);

  if (!isOpen || !item) return null;

  const images = item.galleryImages && item.galleryImages.length > 0 
    ? item.galleryImages 
    : [item.imageUrl];

  const currentImage = images[activeImageIndex] || item.imageUrl;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckoutClick = () => {
    onProceedToCheckout(item, selectedVariant || (item.variants?.[0] ?? 'Default'));
  };

  const handleAskCSClick = () => {
    if (onAskCS) {
      onAskCS(item);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded">
              {item.category === 'apparel' ? 'Apparel' : item.category === 'figure' ? 'Action Figure' : 'Aksesoris'}
            </span>
            <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              {item.animeTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Product Images Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <Image
                  src={currentImage}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx ? 'border-white' : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${item.name} preview ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Info */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Kualitas Terverifikasi</span>
                </div>
                <p className="leading-relaxed">
                  Pengemasan rapi dan aman dengan bubble wrap tebal dan kardus pelindung atas nama Anime Home Store.
                </p>
              </div>
            </div>

            {/* Right: Product Info & Selectors */}
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {item.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    Stok Tersedia
                  </span>
                </div>
              </div>

              {/* Variant Selector */}
              {item.variants && item.variants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Pilih Varian / Ukuran:
                    </label>
                    {item.sizeChart && item.sizeChart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSizeChart(!showSizeChart)}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 underline transition-colors"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        <span>Panduan Ukuran</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.variants.map((variant) => {
                      const isSelected = selectedVariant === variant;
                      return (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-white text-zinc-950 border-white font-semibold'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {variant}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Chart Accordion */}
              {showSizeChart && item.sizeChart && item.sizeChart.length > 0 && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <span className="font-semibold text-zinc-200 block">Tabel Ukuran (Centimeter):</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="py-1 px-2">Size</th>
                          <th className="py-1 px-2">Lebar Dada (cm)</th>
                          <th className="py-1 px-2">Panjang Badan (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {item.sizeChart.map((row) => (
                          <tr key={row.size}>
                            <td className="py-1 px-2 font-medium text-white">{row.size}</td>
                            <td className="py-1 px-2">{row.chest} cm</td>
                            <td className="py-1 px-2">{row.length} cm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                  Deskripsi Produk:
                </span>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.description || 'Produk merchandise resmi bertema anime dengan material premium dan pengerjaan presisi.'}
                </p>
              </div>

              {/* Specifications Table */}
              {item.specifications && item.specifications.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
                    Spesifikasi:
                  </span>
                  <dl className="grid grid-cols-1 gap-1.5 text-xs">
                    {item.specifications.map((spec, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-zinc-900">
                        <dt className="text-zinc-500">{spec.label}</dt>
                        <dd className="text-zinc-300 font-medium text-right max-w-[60%]">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAskCSClick}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span>Tanya CS</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleCheckoutClick}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-950/30"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Beli Sekarang ({selectedVariant || 'Pilih Varian'})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
