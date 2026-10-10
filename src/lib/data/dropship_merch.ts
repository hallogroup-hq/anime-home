import { MerchItem, MerchOrder, ChatMessage } from '@/types';

export const DROPSHIP_MERCH_ITEMS: MerchItem[] = [
  // --- DETECTIVE CONAN ---
  {
    id: 'merch-conan-apparel-1',
    name: 'Kaos Oversize Detective Conan - Shadow Silhouette',
    animeId: 'anime-conan-s30',
    animeTitle: 'Detective Conan',
    price: 139000,
    costPrice: 65000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/conan-tshirt.jpg',
    galleryImages: [
      '/merch/conan-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Kaos cutting oversized streetwear dengan desain siluet ikonik Conan Edogawa dan aksen tipografi kanji Meitantei Conan. Menggunakan material katun combed 24s premium yang sejuk, menyerap keringat, dan memiliki tekstur jatuh yang rapi saat dipakai.',
    specifications: [
      { label: 'Bahan', value: '100% Cotton Combed 24s Reactive (Anti-Bakteri)' },
      { label: 'Sablon', value: 'Direct Transfer Film (DTF) High-Density anti-retak' },
      { label: 'Jahitan', value: 'Jahit rantai pundak standar distro, double stitch kerah' },
      { label: 'Fitting', value: 'Drop Shoulder Oversized Fit' },
      { label: 'Kemasan', value: 'Ziplock bag eksklusif Anime Home Store' }
    ],
    sizeChart: [
      { size: 'S', chest: 52, length: 70 },
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-conan-figure-1',
    name: 'Nendoroid 803 Conan Edogawa (Good Smile Company Authentic)',
    animeId: 'anime-conan-s30',
    animeTitle: 'Detective Conan',
    price: 680000,
    costPrice: 490000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: '/merch/conan-nendoroid.jpg',
    galleryImages: [
      '/merch/conan-nendoroid.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies & Toys Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['Box Segel (MISB Original)', 'Collector Edition Stand'],
    description: 'Nendoroid resmi #803 Conan Edogawa buatan Good Smile Company berlisensi TMS / Gosho Aoyama. Action figure artikulasi poseable lengkap dengan kacamata pelacak, dasi kupu-kupu pengubah suara, kaca pembesar, dan skateboard turbo bertenaga surya.',
    specifications: [
      { label: 'Produsen', value: 'Good Smile Company (Original Lisensi Resmi)' },
      { label: 'Tinggi', value: 'Sekitar 100mm (Non-scale)' },
      { label: 'Bahan', value: 'Painted ABS & PVC Articulated Figure' },
      { label: 'Kelengkapan', value: '3 Face plates, Skateboard, Kacamata, Dasi pita, Base stand transparan' },
      { label: 'Kondisi', value: 'Mint In Sealed Box (MISB)' }
    ]
  },
  {
    id: 'merch-conan-hoodie-1',
    name: 'Hoodie Pullover Detective Conan - APTX 4869 Chemical Formula',
    animeId: 'anime-conan-s30',
    animeTitle: 'Detective Conan',
    price: 219000,
    costPrice: 110000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/conan-hoodie.jpg',
    galleryImages: [
      '/merch/conan-hoodie.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['M', 'L', 'XL', 'XXL'],
    description: 'Hoodie pullover fleece tebal dengan grafis kapsul obat misterius APTX 4869 dan rumus molekul kimia di dada. Tudung kepala ganda (double-lined hood) dilengkapi tali serut tebal dan saku kangguru luas di bagian depan.',
    specifications: [
      { label: 'Bahan', value: 'Cotton Heavy Fleece 280-300 GSM (Tebal, Lembut & Hangat)' },
      { label: 'Sablon', value: 'Polyflex DTF HD Screen Printing' },
      { label: 'Manset', value: 'Rib elastis katun premium pada ujung lengan dan pinggang' },
      { label: 'Fitting', value: 'Relaxed Comfort Fit' },
      { label: 'Kemasan', value: 'Polybag Anime Home Store dengan Silica Gel' }
    ],
    sizeChart: [
      { size: 'M', chest: 56, length: 68 },
      { size: 'L', chest: 59, length: 71 },
      { size: 'XL', chest: 62, length: 74 },
      { size: 'XXL', chest: 65, length: 77 }
    ]
  },
  {
    id: 'merch-conan-acc-1',
    name: 'Gantungan Kunci Akrilik Double-Sided Conan & Kaito Kid',
    animeId: 'anime-conan-s30',
    animeTitle: 'Detective Conan',
    price: 35000,
    costPrice: 12000,
    currency: 'IDR',
    category: 'accessory',
    imageUrl: '/merch/conan-keychain.jpg',
    galleryImages: [
      '/merch/conan-keychain.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Custom Acrylic Bandung (Direct POD)',
    supplierUrl: 'https://tokopedia.com',
    supplierPhone: '+6281344556677',
    stockStatus: 'in_stock',
    variants: ['Conan & Kaito Kid', 'Conan & Ran Mori', 'Ai Haibara & Conan', 'Toru Amuro Zero'],
    description: 'Gantungan kunci akrilik jernih 4mm dengan ilustrasi chibi Conan Edogawa dan rival abadinya Kaito Kid. Cetakan dua sisi dengan lapisan akrilik ganda sehingga gambar terlindung di dalam dan tidak akan lecet tergores kunci.',
    specifications: [
      { label: 'Bahan', value: 'Akrilik Bening Tebal 4mm (Sandwich Double-Sided Print)' },
      { label: 'Ukuran', value: 'Tinggi 6.5 cm, Lebar proporsional' },
      { label: 'Pengait', value: 'Gantungan putar lobster clasp logam alloy anti-karat' },
      { label: 'Kemasan', value: 'Plastik OPP bening + backing card Anime Home Store' }
    ]
  },

  // --- SOUSOU NO FRIEREN ---
  {
    id: 'merch-frieren-apparel-1',
    name: 'Kaos Aesthetic Sousou no Frieren - Zoltraak Grimoire Vintage',
    animeId: 'anime-frieren',
    animeTitle: 'Sousou no Frieren',
    price: 139000,
    costPrice: 65000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/frieren-tshirt.jpg',
    galleryImages: [
      '/merch/frieren-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Kaos bernuansa vintage wash charcoal dengan ilustrasi lingkaran sihir astral Frieren dan tongkat sihir legendaris. Dilengkapi kanji resmi 葬送のフリーレン.',
    specifications: [
      { label: 'Bahan', value: '100% Cotton Combed 24s Acid Washed / Vintage Finish' },
      { label: 'Sablon', value: 'Direct Transfer Film (DTF) HD White & Antique Gold' },
      { label: 'Jahitan', value: 'Overdeck 3 jarum & jahit rantai pundak' },
      { label: 'Fitting', value: 'Boxy Oversized Streetwear Fit' }
    ],
    sizeChart: [
      { size: 'S', chest: 52, length: 70 },
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-frieren-figure-1',
    name: 'Desktop Cute Figure Frieren - Roomwear Edition (Taito 13cm Original)',
    animeId: 'anime-frieren',
    animeTitle: 'Sousou no Frieren',
    price: 340000,
    costPrice: 220000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: 'https://kyoucdn.id/items/360901-desktop-cute-figure-frieren-roomwear-ver-sousou-no-frieren-13cm.jpg',
    galleryImages: [
      'https://kyoucdn.id/items/360901-desktop-cute-figure-frieren-roomwear-ver-sousou-no-frieren-13cm.jpg',
      'https://kyoucdn.id/items/259445-nendoroid-frieren-sousou-no-frieren.jpg'
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['Original Box (MISB)', 'Display Case Bundle'],
    description: 'Figure original berlisensi lini Desktop Cute dari produsen Taito Jepang. Memperlihatkan Frieren dalam balutan baju tidur santai dengan pose duduk menggemaskan.',
    specifications: [
      { label: 'Produsen', value: 'Taito (Original Prize Figure Jepang)' },
      { label: 'Tinggi', value: '13 cm (Pose duduk)' },
      { label: 'Bahan', value: 'High Grade ATBC-PVC & ABS' },
      { label: 'Kondisi', value: 'Brand New In Box Segel Pabrik (MISB)' }
    ]
  },
  {
    id: 'merch-frieren-acc-1',
    name: 'Gantungan Kunci Mimic Chest vs Frieren Akrilik 3D Charm',
    animeId: 'anime-frieren',
    animeTitle: 'Sousou no Frieren',
    price: 35000,
    costPrice: 12000,
    currency: 'IDR',
    category: 'accessory',
    imageUrl: '/merch/frieren-mimic-keychain.jpg',
    galleryImages: [
      '/merch/frieren-mimic-keychain.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Custom Acrylic Bandung (Direct POD)',
    supplierUrl: 'https://tokopedia.com',
    supplierPhone: '+6281344556677',
    stockStatus: 'in_stock',
    variants: ['Frieren Trapped In Mimic', 'Fern Pout Face', 'Stark Trembling'],
    description: 'Gantungan kunci momen humor legendaris saat Frieren terperangkap peti monster Mimic karena nekat mengecek grimoire sihir langka di dalamnya.',
    specifications: [
      { label: 'Bahan', value: 'Akrilik Tebal 4mm Jernih Laser Cut' },
      { label: 'Ukuran', value: '6 x 6.5 cm' },
      { label: 'Pengait', value: 'Ring O-Ring & Lobster Clasp Logam Chrome' }
    ]
  },

  // --- JUJUTSU KAISEN ---
  {
    id: 'merch-jjk-apparel-1',
    name: 'Kaos Oversize Gojo Satoru - Muryokusho Domain Expansion',
    animeId: 'anime-jjk-s1',
    animeTitle: 'Jujutsu Kaisen',
    price: 145000,
    costPrice: 68000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/gojo-tshirt.jpg',
    galleryImages: [
      '/merch/gojo-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['M', 'L', 'XL', 'XXL'],
    description: 'Kaos streetwear oversized Gojo Satoru saat membuka penutup mata untuk meluncurkan jurus Muryokusho (Infinite Void). Grafis kontras tinggi dengan aksen mata biru menyala.',
    specifications: [
      { label: 'Bahan', value: '100% Cotton Combed 24s Heavyweight' },
      { label: 'Sablon', value: 'DTF Plastisol Hybrid High Resolution' },
      { label: 'Fitting', value: 'Drop Shoulder Streetwear Fit' }
    ],
    sizeChart: [
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-jjk-figure-1',
    name: 'Ichiban Kuji Figure Gojo Satoru - Shibuya Incident (Bandai 19cm)',
    animeId: 'anime-jjk-s1',
    animeTitle: 'Jujutsu Kaisen',
    price: 750000,
    costPrice: 480000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: 'https://kyoucdn.id/items/410466-ichiban-kuji-figure-gojo-satoru-jujutsu-kaisen-shibuya-incident-vol1-c-prize-19cm.jpg',
    galleryImages: [
      'https://kyoucdn.id/items/410466-ichiban-kuji-figure-gojo-satoru-jujutsu-kaisen-shibuya-incident-vol1-c-prize-19cm.jpg'
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['C-Prize Masterlise (MISB Box)'],
    description: 'Figure koleksi resmi Bandai Ichiban Kuji Shibuya Incident Prize C. Menampilkan Gojo Satoru setinggi 19cm dengan detail pose dinamis dan cat akurat anime.',
    specifications: [
      { label: 'Produsen', value: 'Bandai Spirits (Masterlise Ichiban Kuji)' },
      { label: 'Tinggi', value: '19 cm' },
      { label: 'Bahan', value: 'PVC & ABS Kokoh Berbobot' },
      { label: 'Kondisi', value: 'MISB Box Segel Lengkap Base Stand' }
    ]
  },

  // --- KIMETSU NO YAIBA ---
  {
    id: 'merch-kny-apparel-1',
    name: 'Kaos Tanjiro Kamado - Hinokami Kagura & Water Breathing',
    animeId: 'anime-hashira',
    animeTitle: 'Kimetsu no Yaiba',
    price: 139000,
    costPrice: 65000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/tanjiro-tshirt.jpg',
    galleryImages: [
      '/merch/tanjiro-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Kaos anime Demon Slayer menampilkan Tanjiro Kamado dengan kombinasi pusaran ombak Pernapasan Air dan kobaran api Tarian Dewa Api (Hinokami Kagura).',
    specifications: [
      { label: 'Bahan', value: '100% Cotton Combed 24s Lembut' },
      { label: 'Sablon', value: 'DTF Full Color Vivid Anti-Kusam' },
      { label: 'Fitting', value: 'Regular to Oversized Comfort Fit' }
    ],
    sizeChart: [
      { size: 'S', chest: 52, length: 70 },
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-kny-figure-1',
    name: 'Nendoroid Tanjiro Kamado (Good Smile Company Authentic)',
    animeId: 'anime-hashira',
    animeTitle: 'Kimetsu no Yaiba',
    price: 780000,
    costPrice: 520000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: 'https://kyoucdn.id/items/81592-nendoroid-tanjiro-kamado-kimetsu-no-yaiba-re-release.jpg',
    galleryImages: [
      'https://kyoucdn.id/items/81592-nendoroid-tanjiro-kamado-kimetsu-no-yaiba-re-release.jpg',
      'https://kyoucdn.id/items/220219-pvc-figure-17-tomioka-giyuu-dx-ver-kimetsu-no-yaiba.jpg'
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['Box Segel Pabrik (MISB)', 'Bundle Efek Air & Api'],
    description: 'Nendoroid original Tanjiro Kamado buatan Good Smile Company. Dilengkapi pedang Nichirin hitam, efek partikel ombak air, dan kotak punggung kayu tempat Nezuko beristirahat.',
    specifications: [
      { label: 'Produsen', value: 'Good Smile Company (Original Lisensi Resmi)' },
      { label: 'Tinggi', value: '10 cm' },
      { label: 'Bahan', value: 'ABS & PVC Articulated Action Figure' }
    ]
  },

  // --- SOLO LEVELING ---
  {
    id: 'merch-solo-apparel-1',
    name: 'Kaos Sung Jin-Woo - Arise Shadow Monarch Heavyweight',
    animeId: 'anime-solo',
    animeTitle: 'Solo Leveling',
    price: 149000,
    costPrice: 68000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/solo-tshirt.jpg',
    galleryImages: [
      '/merch/solo-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['M', 'L', 'XL', 'XXL'],
    description: 'Kaos grafis Sung Jin-Woo mengangkat belati pemburu dengan aura bayangan ungu pekat dan komando mutlak "ARISE". Tinta sablon awet bertekstur halus.',
    specifications: [
      { label: 'Bahan', value: 'Cotton Combed 24s Premium Pre-shrunk' },
      { label: 'Sablon', value: 'DTF HD Ultra-Sharp Contrast' },
      { label: 'Fitting', value: 'Streetwear Boxy Fit' }
    ],
    sizeChart: [
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-solo-figure-1',
    name: 'Nendoroid Sung Jin-Woo Shadow Monarch (Good Smile Company)',
    animeId: 'anime-solo',
    animeTitle: 'Solo Leveling',
    price: 870000,
    costPrice: 590000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: 'https://kyoucdn.id/items/307374-nendoroid-sung-jin-woo-solo-leveling-285514190.jpg',
    galleryImages: [
      'https://kyoucdn.id/items/307374-nendoroid-sung-jin-woo-solo-leveling-285514190.jpg',
      'https://kyoucdn.id/items/266037-solo-leveling-big-acrylic-stand-01-sung-jinwoo.jpg'
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['Original Box (MISB)', 'Deluxe Shadow Base'],
    description: 'Nendoroid resmi pertama sang Hunter Rank S Sung Jin-Woo. Dilengkapi belati Kasaka Poison Fang, Knight Killer, mata biru menyala, dan efek pemanggilan prajurit bayangan.',
    specifications: [
      { label: 'Produsen', value: 'Good Smile Company' },
      { label: 'Tinggi', value: '10 cm' },
      { label: 'Bahan', value: 'ABS & PVC Articulated Action Figure' }
    ]
  },

  // --- ATTACK ON TITAN ---
  {
    id: 'merch-aot-apparel-1',
    name: 'Kaos Wings of Freedom - Survey Corps Vintage Washed',
    animeId: 'anime-aot-s1',
    animeTitle: 'Attack on Titan',
    price: 139000,
    costPrice: 65000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/aot-tshirt.jpg',
    galleryImages: [
      '/merch/aot-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Kaos bergaya militer retro washed abu arang dengan lambang Sayap Kebebasan (Wings of Freedom) korps penyelidik Shingeki no Kyojin.',
    specifications: [
      { label: 'Bahan', value: 'Cotton Combed 24s Washed Charcoal' },
      { label: 'Sablon', value: 'Distressed Vintage Discharge Screen Print' },
      { label: 'Fitting', value: 'Relaxed Oversize Fit' }
    ],
    sizeChart: [
      { size: 'S', chest: 52, length: 70 },
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-aot-acc-1',
    name: 'Kalung Kunci Ruang Bawah Tanah Eren Yeager (Antique Bronze & Kulit Asli)',
    animeId: 'anime-aot-s1',
    animeTitle: 'Attack on Titan',
    price: 49000,
    costPrice: 18000,
    currency: 'IDR',
    category: 'accessory',
    imageUrl: '/merch/aot-key.jpg',
    galleryImages: [
      '/merch/aot-key.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Custom Metal Crafts (White-label Direct)',
    supplierUrl: 'https://tokopedia.com',
    supplierPhone: '+6281344556677',
    stockStatus: 'in_stock',
    variants: ['Kunci Perunggu Antik + Tali Kulit Coklat'],
    description: 'Replika logam padat berat kunci ruang bawah tanah Grisha Yeager yang diwariskan ke Eren. Tali terbuat dari kulit sapi asli yang kokoh dan tahan keringat.',
    specifications: [
      { label: 'Bahan Kunci', value: 'Logam Padat Zinc Alloy Antique Bronze Finish' },
      { label: 'Panjang Kunci', value: '6.8 cm' },
      { label: 'Bahan Tali', value: 'Kulit Sapi Asli (Panjang 70 cm bisa diatur)' },
      { label: 'Kemasan', value: 'Pouch beludru hitam Anime Home Store' }
    ]
  },

  // --- ONE PIECE ---
  {
    id: 'merch-op-apparel-1',
    name: 'Kaos Gear 5 Sun God Nika Luffy - Drums of Liberation',
    animeId: 'anime-op',
    animeTitle: 'One Piece',
    price: 145000,
    costPrice: 68000,
    currency: 'IDR',
    category: 'apparel',
    imageUrl: '/merch/op-tshirt.jpg',
    galleryImages: [
      '/merch/op-tshirt.jpg',
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Bandung DTF Apparel POD (White-label Direct)',
    supplierUrl: 'https://shopee.co.id',
    supplierPhone: '+6281299887766',
    stockStatus: 'in_stock',
    variants: ['M', 'L', 'XL', 'XXL'],
    description: 'Kaos streetwear manga monokrom kontras tinggi memperlihatkan wujud Dewa Matahari Nika Gear 5 Luffy yang tertawa bebas diiringi Genderang Pembebasan.',
    specifications: [
      { label: 'Bahan', value: '100% Cotton Combed 24s Heavy Cotton' },
      { label: 'Sablon', value: 'DTF High Contrast White on Jet Black' },
      { label: 'Fitting', value: 'Boxy Drop Shoulder Oversize' }
    ],
    sizeChart: [
      { size: 'M', chest: 55, length: 73 },
      { size: 'L', chest: 58, length: 75 },
      { size: 'XL', chest: 61, length: 78 },
      { size: 'XXL', chest: 64, length: 80 }
    ]
  },
  {
    id: 'merch-op-figure-1',
    name: 'PVC Figure Monkey D. Luffy Gear 5 (Banpresto 17cm Original)',
    animeId: 'anime-op',
    animeTitle: 'One Piece',
    price: 340000,
    costPrice: 220000,
    currency: 'IDR',
    category: 'figure',
    imageUrl: 'https://kyoucdn.id/items/472775-pvc-figure-monkey-d-luffy-gear-5-one-piece-battle-record-collection-17cm.jpg',
    galleryImages: [
      'https://kyoucdn.id/items/472775-pvc-figure-monkey-d-luffy-gear-5-one-piece-battle-record-collection-17cm.jpg',
      'https://kyoucdn.id/items/219094-portrait-of-pirates-pop-monkey-d-luffy-gear-5-ver-534482092.jpg'
    ],
    storeName: 'Anime Home Store',
    destinationUrl: '#checkout',
    isAffiliate: false,
    verificationState: 'verified',
    supplierName: 'Jakmall Hobbies Supplier (White-label)',
    supplierUrl: 'https://jakmall.com',
    supplierPhone: '+628118899001',
    stockStatus: 'in_stock',
    variants: ['Original Box (MISB)', 'Collector Edition Stand'],
    description: 'Figure resmi Banpresto Battle Record Collection Monkey D. Luffy Gear 5. Rambut dan awan melingkar terpahat sempurna dengan pose aksi yang dinamis.',
    specifications: [
      { label: 'Produsen', value: 'Banpresto / Bandai Spirits' },
      { label: 'Tinggi', value: '17 cm' },
      { label: 'Bahan', value: 'PVC & ABS Original Berlisensi Toei Animation' },
      { label: 'Kondisi', value: 'MISB Box Segel Pabrik' }
    ]
  }
];

export const INITIAL_ORDERS: MerchOrder[] = [
  {
    id: 'order-179162901-a1b2',
    merchId: 'merch-conan-apparel-1',
    merchName: 'Kaos Oversize Detective Conan - Shadow Silhouette',
    merchImage: '/merch/conan-tshirt.jpg',
    animeTitle: 'Detective Conan',
    customerName: 'Dimas Aditya',
    customerContact: '081289123456',
    shippingAddress: 'Jl. Melati No. 14, RT 02 / RW 05, Menteng',
    city: 'Jakarta Pusat',
    selectedVariant: 'XL',
    quantity: 1,
    totalAmount: 139000,
    costAmount: 65000,
    profitAmount: 74000,
    paymentMethod: 'qris',
    paymentStatus: 'paid',
    shippingStatus: 'processing',
    dropshipStatus: 'dispatched_to_supplier',
    supplierOrderId: 'SUPP-POD-89104',
    supplierNotes: 'Sudah di-push otomatis ke Bandung DTF POD, menunggu input resi.',
    trackingNumber: 'AH-POD-891204',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'order-179162802-c3d4',
    merchId: 'merch-conan-figure-1',
    merchName: 'Nendoroid 803 Conan Edogawa (Good Smile Company Authentic)',
    merchImage: '/merch/conan-nendoroid.jpg',
    animeTitle: 'Detective Conan',
    customerName: 'Siti Rahmawati',
    customerContact: '085712348765',
    shippingAddress: 'Komplek Griya Asri Blok B3 No. 7, Sukajadi',
    city: 'Bandung',
    selectedVariant: 'Box Segel (MISB Original)',
    quantity: 1,
    totalAmount: 680000,
    costAmount: 490000,
    profitAmount: 190000,
    paymentMethod: 'qris',
    paymentStatus: 'paid',
    shippingStatus: 'shipped',
    dropshipStatus: 'shipped',
    supplierOrderId: 'SUPP-JAKMALL-77192',
    supplierNotes: 'Paket dikirim kurir JNE atas nama Anime Home Store.',
    trackingNumber: 'JN-REG-771920381',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    sessionId: 'session-guest-sample-1',
    sender: 'customer',
    senderName: 'Budi Santoso',
    message: 'Halo, untuk kaos Detective Conan ukuran XL apakah bahannya tebal dan sablonnya awet dicuci?',
    merchRef: {
      id: 'merch-conan-apparel-1',
      name: 'Kaos Oversize Detective Conan - Shadow Silhouette',
      imageUrl: '/merch/conan-tshirt.jpg',
      price: 139000,
    },
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: 'msg-seed-2',
    sessionId: 'session-guest-sample-1',
    sender: 'admin',
    senderName: 'Customer Service',
    message: 'Halo kak Budi! Bahannya menggunakan Cotton Combed 24s asli sehingga adem namun tebal tidak menerawang. Sablonnya memakai teknik DTF High-Density yang lentur dan awet dicuci berkali-kali.',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    read: true,
  },
  {
    id: 'msg-seed-3',
    sessionId: 'session-guest-sample-1',
    sender: 'customer',
    senderName: 'Budi Santoso',
    message: 'Baik, saya langsung checkout dengan QRIS ya. Pengiriman atas nama Anime Home Store kan?',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    read: false,
  },
];
