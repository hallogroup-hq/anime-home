import fs from 'fs';
import path from 'path';

function pad(num: number, size = 2): string {
  return String(num).padStart(size, '0');
}

function cleanSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// -------------------------------------------------------------
// 1. TOP MYANIMELIST FRANCHISES (SEASON BY SEASON WITH DISTINCT POSTERS)
// -------------------------------------------------------------
interface MALSeasonDef {
  franchiseId: string;
  franchiseName: string;
  seasonNum: number;
  id: string;
  title: string;
  slug: string;
  year: number;
  seasonPeriod: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  type: 'TV' | 'Movie';
  episodesCount: number;
  airingStatus: 'completed' | 'airing' | 'scheduled';
  scheduleWIB?: string;
  genres: string[];
  synopsis: string;
  poster: string;
  banner: string;
  canonStatus: 'Canon' | 'Canon Movie';
  aliases: Array<{ locale: string; title: string; titleType: string }>;
  isExistingAnime?: boolean;
}

export const MAL_SEASONS_CATALOG: MALSeasonDef[] = [
  // --- ATTACK ON TITAN (SHINGEKI NO KYOJIN) ---
  {
    franchiseId: 'fr-aot',
    franchiseName: 'Attack on Titan (Shingeki no Kyojin)',
    seasonNum: 1,
    id: 'anime-aot-s1',
    title: 'Attack on Titan Season 1',
    slug: 'attack-on-titan-season-1',
    year: 2013,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Action', 'Drama', 'Fantasy', 'Shounen', 'Suspense'],
    synopsis: 'Ratusan tahun lalu, umat manusia nyaris punah akibat serangan raksasa mengerikan yang dikenal sebagai Titan. Eren Yeager bersumpah membasmi seluruh Titan setelah ibunya tewas saat Wall Maria dijebol Colossal Titan.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Shingeki no Kyojin Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Attack on Titan Season 1', titleType: 'english' },
      { locale: 'ja-JP', title: '進撃の巨人 第1期', titleType: 'japanese' },
      { locale: 'id-ID', title: 'Serangan Raksasa Musim 1', titleType: 'canonical' },
    ],
  },
  {
    franchiseId: 'fr-aot',
    franchiseName: 'Attack on Titan (Shingeki no Kyojin)',
    seasonNum: 2,
    id: 'anime-aot-s2',
    title: 'Attack on Titan Season 2',
    slug: 'attack-on-titan-season-2',
    year: 2017,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 12,
    airingStatus: 'completed',
    genres: ['Action', 'Drama', 'Fantasy', 'Shounen', 'Suspense'],
    synopsis: 'Eren Yeager dan Pasukan Penyelidik menghadapi ancaman Beast Titan misterius. Pengkhianatan besar terkuak di dalam dinding saat identitas Armored Titan dan Colossal Titan akhirnya terungkap.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20958-HuFJyr54Mmir.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20958-Y7eQdz9VENBD.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Shingeki no Kyojin Season 2', titleType: 'romaji' },
      { locale: 'en-US', title: 'Attack on Titan Season 2', titleType: 'english' },
      { locale: 'ja-JP', title: '進撃の巨人 Season 2', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-aot',
    franchiseName: 'Attack on Titan (Shingeki no Kyojin)',
    seasonNum: 3,
    id: 'anime-aot-s3',
    title: 'Attack on Titan Season 3',
    slug: 'attack-on-titan-season-3',
    year: 2018,
    seasonPeriod: 'Summer',
    type: 'TV',
    episodesCount: 22,
    airingStatus: 'completed',
    genres: ['Action', 'Drama', 'Fantasy', 'Shounen', 'Suspense'],
    synopsis: 'Konspirasi internal kerajaan terbongkar oleh Pasukan Penyelidik. Misi perebutan kembali Wall Maria memicu pertempuran puncak Shiganshina, mengungkap rahasia ruang bawah tanah ayah Eren dan pemandangan laut lepas.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99147-AiPDD8cwlCfi.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/99147-HACsFVrynFf5.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Shingeki no Kyojin Season 3', titleType: 'romaji' },
      { locale: 'en-US', title: 'Attack on Titan Season 3', titleType: 'english' },
      { locale: 'ja-JP', title: '進撃の巨人 Season 3', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-aot',
    franchiseName: 'Attack on Titan (Shingeki no Kyojin)',
    seasonNum: 4,
    id: 'anime-aot-s4',
    title: 'Attack on Titan: The Final Season',
    slug: 'attack-on-titan-the-final-season',
    year: 2020,
    seasonPeriod: 'Winter',
    type: 'TV',
    episodesCount: 29,
    airingStatus: 'completed',
    genres: ['Action', 'Drama', 'Fantasy', 'Shounen', 'Suspense'],
    synopsis: 'Pertarungan antara Pulau Paradis dan Kekaisaran Marley mencapai klimaks mengerikan. Eren Yeager memulai The Rumbling (Gemuruh) untuk memusnahkan dunia luar demi kebebasan Eldia.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-sKUNXAsWMNFw.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/110277-iuGn6F5bK1U1.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Shingeki no Kyojin: The Final Season', titleType: 'romaji' },
      { locale: 'en-US', title: 'Attack on Titan Season 4', titleType: 'english' },
      { locale: 'ja-JP', title: '進撃の巨人 The Final Season', titleType: 'japanese' },
    ],
  },

  // --- DEMON SLAYER (KIMETSU NO YAIBA) ---
  {
    franchiseId: 'fr-demonslayer',
    franchiseName: 'Kimetsu no Yaiba (Demon Slayer)',
    seasonNum: 1,
    id: 'anime-kny-s1',
    title: 'Demon Slayer: Kimetsu no Yaiba Season 1',
    slug: 'demon-slayer-kimetsu-no-yaiba-season-1',
    year: 2019,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 26,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Historical', 'Shounen'],
    synopsis: 'Tanjiro Kamado hidup damai bersama keluarganya di gunung hingga suatu hari iblis membantai seluruh keluarganya. Adik perempuannya, Nezuko, selamat namun berubah menjadi iblis. Tanjiro bersumpah menjadi pembasmi iblis untuk membalas dendam dan mengembalikan kemanusiaan adiknya.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Kimetsu no Yaiba Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Demon Slayer Season 1', titleType: 'english' },
      { locale: 'ja-JP', title: '鬼滅の刃 竈門炭治郎 立志編', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-demonslayer',
    franchiseName: 'Kimetsu no Yaiba (Demon Slayer)',
    seasonNum: 2,
    id: 'anime-kny-movie-mugen',
    title: 'Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train',
    slug: 'demon-slayer-mugen-train-movie',
    year: 2020,
    seasonPeriod: 'Fall',
    type: 'Movie',
    episodesCount: 1,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Historical', 'Shounen'],
    synopsis: 'Tanjiro, Zenitsu, dan Inosuke bergabung dengan Hashira Api Kyojuro Rengoku di dalam Kereta Mugen untuk menghadapi iblis Enmu dan Akaza.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx112151-1qlQwPB1RrJe.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/112151-eHCBz19nf2yC.jpg',
    canonStatus: 'Canon Movie',
    aliases: [
      { locale: 'ja-Latn', title: 'Gekijouban Kimetsu no Yaiba: Mugen Ressha-hen', titleType: 'romaji' },
      { locale: 'en-US', title: 'Demon Slayer: Mugen Train Movie', titleType: 'english' },
      { locale: 'ja-JP', title: '劇場版 鬼滅の刃 無限列車編', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-demonslayer',
    franchiseName: 'Kimetsu no Yaiba (Demon Slayer)',
    seasonNum: 3,
    id: 'anime-kny-s2',
    title: 'Demon Slayer: Entertainment District Arc (Season 2)',
    slug: 'demon-slayer-entertainment-district-arc-season-2',
    year: 2021,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 11,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Historical', 'Shounen'],
    synopsis: 'Misi penyamaran Tanjiro dan kawan-kawan bersama Hashira Suara Tengen Uzui di distrik hiburan Yoshiwara melawan Iblis Peringkat Atas Enam Daki dan Gyutaro.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142329-kET1PIXJv2eW.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/142329-i413SzLmToZN.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Kimetsu no Yaiba: Yuukaku-hen', titleType: 'romaji' },
      { locale: 'en-US', title: 'Demon Slayer Season 2', titleType: 'english' },
      { locale: 'ja-JP', title: '鬼滅の刃 遊郭編', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-demonslayer',
    franchiseName: 'Kimetsu no Yaiba (Demon Slayer)',
    seasonNum: 4,
    id: 'anime-kny-s3',
    title: 'Demon Slayer: Swordsmith Village Arc (Season 3)',
    slug: 'demon-slayer-swordsmith-village-arc-season-3',
    year: 2023,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 11,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Historical', 'Shounen'],
    synopsis: 'Tanjiro menuju Desa Penempa Pedang untuk memperbaiki pedang Nichirin miliknya, bersama Muichiro Tokito dan Mitsuri Kanroji melawan Hantengu dan Gyokko.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/145139-V01Prh6UzfRk.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Kimetsu no Yaiba: Katanakaji no Sato-hen', titleType: 'romaji' },
      { locale: 'en-US', title: 'Demon Slayer Season 3', titleType: 'english' },
      { locale: 'ja-JP', title: '鬼滅の刃 刀鍛冶の里編', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-demonslayer',
    franchiseName: 'Kimetsu no Yaiba (Demon Slayer)',
    seasonNum: 5,
    id: 'anime-hashira',
    title: 'Demon Slayer: Hashira Training Arc (Season 4)',
    slug: 'kimetsu-no-yaiba-hashira-geiko-hen',
    year: 2024,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 8,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Historical', 'Shounen'],
    synopsis: 'Latihan intensif bersama seluruh Hashira sebelum perang Infinity Castle.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166240-PBV7zukIHW7V.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/166240-YdxoEhrfwNk0.jpg',
    canonStatus: 'Canon',
    aliases: [],
    isExistingAnime: true,
  },

  // --- JUJUTSU KAISEN ---
  {
    franchiseId: 'fr-jjk',
    franchiseName: 'Jujutsu Kaisen',
    seasonNum: 1,
    id: 'anime-jjk-s1',
    title: 'Jujutsu Kaisen Season 1',
    slug: 'jujutsu-kaisen-season-1',
    year: 2020,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 24,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Shounen', 'Supernatural'],
    synopsis: 'Yuji Itadori menelan jari terkutuk Ryomen Sukuna demi menyelamatkan temannya. Di bawah bimbingan Satoru Gojo di SMK Jujutsu Tokyo, ia belajar mengendalikan energi kutukan.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Jujutsu Kaisen Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Sorcery Fight Season 1', titleType: 'english' },
      { locale: 'ja-JP', title: '呪術廻戦 第1期', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-jjk',
    franchiseName: 'Jujutsu Kaisen',
    seasonNum: 2,
    id: 'anime-jjk-movie0',
    title: 'Jujutsu Kaisen 0 (Movie)',
    slug: 'jujutsu-kaisen-0-movie',
    year: 2021,
    seasonPeriod: 'Winter',
    type: 'Movie',
    episodesCount: 1,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Shounen', 'Supernatural'],
    synopsis: 'Prequel kanonikal mengisahkan Yuta Okkotsu yang dihantui kutukan teman masa kecilnya, Rika Orimoto. Suguru Geto melancarkan Parade Malam 100 Iblis di Shinjuku dan Kyoto.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131573-rpl82vDEDRm6.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/131573-3veuVz5p0z2I.jpg',
    canonStatus: 'Canon Movie',
    aliases: [
      { locale: 'ja-Latn', title: 'Gekijouban Jujutsu Kaisen 0', titleType: 'romaji' },
      { locale: 'en-US', title: 'Jujutsu Kaisen 0 The Movie', titleType: 'english' },
      { locale: 'ja-JP', title: '劇場版 呪術廻戦 0', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-jjk',
    franchiseName: 'Jujutsu Kaisen',
    seasonNum: 3,
    id: 'anime-jujutsu',
    title: 'Jujutsu Kaisen Season 2 (Shibuya Incident)',
    slug: 'jujutsu-kaisen-season-2',
    year: 2023,
    seasonPeriod: 'Summer',
    type: 'TV',
    episodesCount: 23,
    airingStatus: 'completed',
    genres: ['Action', 'Fantasy', 'Shounen', 'Supernatural'],
    synopsis: 'Kilas balik masa muda Gojo dan Geto saat misi Pengawal Wadah Plasma Bintang, dilanjutkan tragedi Insiden Shibuya 31 Oktober di mana penyihir jujutsu diuji sampai batas kehancuran.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg',
    canonStatus: 'Canon',
    aliases: [],
    isExistingAnime: true,
  },

  // --- MY HERO ACADEMIA (BOKU NO HERO ACADEMIA) ---
  {
    franchiseId: 'fr-mha',
    franchiseName: 'My Hero Academia (Boku no Hero Academia)',
    seasonNum: 1,
    id: 'anime-mha-s1',
    title: 'My Hero Academia Season 1',
    slug: 'my-hero-academia-season-1',
    year: 2016,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 13,
    airingStatus: 'completed',
    genres: ['Action', 'Shounen', 'Super Power'],
    synopsis: 'Izuku Midoriya terlahir tanpa Quirk di dunia manusia super. Pahlawan nomor satu All Might mewariskan kekuatan One For All kepadanya untuk masuk SMA U.A.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-nYh85uj2Fuwr.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21459-yeVkolGKdGUV.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Boku no Hero Academia Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'My Hero Academia Season 1', titleType: 'english' },
      { locale: 'ja-JP', title: '僕のヒーローアカデミア 第1期', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-mha',
    franchiseName: 'My Hero Academia (Boku no Hero Academia)',
    seasonNum: 2,
    id: 'anime-mha-s2',
    title: 'My Hero Academia Season 2',
    slug: 'my-hero-academia-season-2',
    year: 2017,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Action', 'Shounen', 'Super Power'],
    synopsis: 'Festival Olahraga U.A. mempertontonkan duel epik Deku vs Shoto Todoroki. Ancaman Hero Killer Stain menguji nilai moral para calon pahlawan di Hosu.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21856-gutauxhWAwn6.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21856-wtSHgeHFmzdG.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Boku no Hero Academia Season 2', titleType: 'romaji' },
      { locale: 'en-US', title: 'My Hero Academia Season 2', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-mha',
    franchiseName: 'My Hero Academia (Boku no Hero Academia)',
    seasonNum: 3,
    id: 'anime-mha-s3',
    title: 'My Hero Academia Season 3',
    slug: 'my-hero-academia-season-3',
    year: 2018,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Action', 'Shounen', 'Super Power'],
    synopsis: 'Kamp pelatihan hutan diserang Vanguard Action Squad. All Might bertarung sampai tetes darah penghabisan melawan All For One di Kamino.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx100166-jUCZYbzn2XLw.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/100166-k7RXwN5vZg0r.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Boku no Hero Academia Season 3', titleType: 'romaji' },
      { locale: 'en-US', title: 'My Hero Academia Season 3', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-mha',
    franchiseName: 'My Hero Academia (Boku no Hero Academia)',
    seasonNum: 4,
    id: 'anime-mha-s4',
    title: 'My Hero Academia Season 4',
    slug: 'my-hero-academia-season-4',
    year: 2019,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Action', 'Shounen', 'Super Power'],
    synopsis: 'Deku magang di agensi Sir Nighteye untuk menyelamatkan gadis kecil bernama Eri dari cengkeraman Overhaul dan sindikat Shie Hassaikai.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104276-SnEowMvesWIE.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/104276-PQO1pcNzzWT0.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Boku no Hero Academia Season 4', titleType: 'romaji' },
      { locale: 'en-US', title: 'My Hero Academia Season 4', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-mha',
    franchiseName: 'My Hero Academia (Boku no Hero Academia)',
    seasonNum: 7,
    id: 'anime-mha-s7',
    title: 'My Hero Academia Season 7',
    slug: 'my-hero-academia-season-7',
    year: 2024,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 21,
    airingStatus: 'completed',
    genres: ['Action', 'Shounen', 'Super Power'],
    synopsis: 'Perang Pamungkas antara para Pahlawan melawan All For One dan Shigaraki Tomura. Pahlawan nomor satu Amerika Serikat Star and Stripe turun tangan di langit Jepang.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163139-JchZhUFlNTWU.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163139-UWM3qDG5cRa6.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Boku no Hero Academia Season 7', titleType: 'romaji' },
      { locale: 'en-US', title: 'My Hero Academia Season 7', titleType: 'english' },
    ],
  },

  // --- BLEACH & THOUSAND-YEAR BLOOD WAR ---
  {
    franchiseId: 'fr-bleach',
    franchiseName: 'Bleach',
    seasonNum: 1,
    id: 'anime-bleach-classic',
    title: 'Bleach (Original Series)',
    slug: 'bleach-original-series',
    year: 2004,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 366,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Supernatural', 'Shounen'],
    synopsis: 'Ichigo Kurosaki memperoleh kekuatan Shinigami dari Rukia Kuchiki dan bertarung melindungi Karakura Town serta menyelamatkan Soul Society dari konspirasi Sosuke Aizen.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-d2GmRkJbMopq.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/269-08ar2HJOUAuL.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Bleach Classic', titleType: 'romaji' },
      { locale: 'en-US', title: 'Bleach TV', titleType: 'english' },
      { locale: 'ja-JP', title: 'ブリーチ', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-bleach',
    franchiseName: 'Bleach',
    seasonNum: 2,
    id: 'anime-bleach-tybw1',
    title: 'Bleach: Thousand-Year Blood War',
    slug: 'bleach-thousand-year-blood-war',
    year: 2022,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 13,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Supernatural', 'Shounen'],
    synopsis: 'Kaisar Quincy Yhwach bangkit setelah seribu tahun dan menyatakan perang total terhadap Gotei 13. Soul Society hancur dalam invasi berdarah pertama Wandenreich.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx116674-p3zK4PUX2Aag.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/116674-l2YlIyJzvGSV.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Bleach: Sennen Kessen-hen', titleType: 'romaji' },
      { locale: 'en-US', title: 'Bleach: TYBW Part 1', titleType: 'english' },
      { locale: 'ja-JP', title: 'BLEACH 千年血戦篇', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-bleach',
    franchiseName: 'Bleach',
    seasonNum: 3,
    id: 'anime-bleach-tybw2',
    title: 'Bleach: Thousand-Year Blood War - The Separation',
    slug: 'bleach-thousand-year-blood-war-the-separation',
    year: 2023,
    seasonPeriod: 'Summer',
    type: 'TV',
    episodesCount: 13,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Supernatural', 'Shounen'],
    synopsis: 'Ichigo kembali dari Istana Jiwa dengan Zangetsu sejati. Sternritter melancarkan invasi kedua dengan kekuatan Vollständig mereka.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx159322-Sp1GflRhE6Po.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/159322-biJjvtNkhkxR.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Bleach: Sennen Kessen-hen - Ketsubetsu-tan', titleType: 'romaji' },
      { locale: 'en-US', title: 'Bleach: TYBW Part 2', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-bleach',
    franchiseName: 'Bleach',
    seasonNum: 4,
    id: 'anime-bleach-tybw3',
    title: 'Bleach: Thousand-Year Blood War - The Conflict',
    slug: 'bleach-thousand-year-blood-war-the-conflict',
    year: 2024,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 13,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Supernatural', 'Shounen'],
    synopsis: 'Pertempuran di Istana Raja Roh (Soul King Palace) antara Pengawal Kerajaan Skuad Zero melawan Yhwach dan Schutzstaffel.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx169755-Rqb7MjnzdTc6.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/169755-hCWjp9ajjMYV.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Bleach: Sennen Kessen-hen - Soukoku-tan', titleType: 'romaji' },
      { locale: 'en-US', title: 'Bleach: TYBW Part 3', titleType: 'english' },
      { locale: 'ja-JP', title: 'BLEACH 千年血戦篇-相剋譚-', titleType: 'japanese' },
    ],
  },

  // --- FULLMETAL ALCHEMIST: BROTHERHOOD ---
  {
    franchiseId: 'fr-fmab',
    franchiseName: 'Fullmetal Alchemist: Brotherhood',
    seasonNum: 1,
    id: 'anime-fmab',
    title: 'Fullmetal Alchemist: Brotherhood',
    slug: 'fullmetal-alchemist-brotherhood',
    year: 2009,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 64,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Military'],
    synopsis: 'Edward dan Alphonse Elric melanggar tabu terbesar alkimia: transmutasi manusia untuk membangkitkan ibu mereka. Berbekal tubuh prostetik logam, mereka mencari Batu Bertuah untuk memulihkan raga mereka.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Hagane no Renkinjutsushi: Fullmetal Alchemist', titleType: 'romaji' },
      { locale: 'en-US', title: 'Fullmetal Alchemist: Brotherhood', titleType: 'english' },
      { locale: 'ja-JP', title: '鋼の錬金術師 FULLMETAL ALCHEMIST', titleType: 'japanese' },
    ],
  },

  // --- DEATH NOTE ---
  {
    franchiseId: 'fr-deathnote',
    franchiseName: 'Death Note',
    seasonNum: 1,
    id: 'anime-deathnote',
    title: 'Death Note',
    slug: 'death-note',
    year: 2006,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 37,
    airingStatus: 'completed',
    genres: ['Psychological', 'Supernatural', 'Suspense', 'Mystery'],
    synopsis: 'Light Yagami menemukan buku catatan kematian milik Shinigami Ryuk. Dengan membunuh penjahat di balik nama samaran "Kira", ia diburu oleh detektif jenius terhebat dunia, L.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Death Note', titleType: 'romaji' },
      { locale: 'en-US', title: 'Death Note', titleType: 'english' },
      { locale: 'ja-JP', title: 'デスノート', titleType: 'japanese' },
    ],
  },

  // --- HUNTER X HUNTER (2011) ---
  {
    franchiseId: 'fr-hxh',
    franchiseName: 'Hunter x Hunter',
    seasonNum: 1,
    id: 'anime-hxh-2011',
    title: 'Hunter x Hunter (2011)',
    slug: 'hunter-x-hunter-2011',
    year: 2011,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 148,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'],
    synopsis: 'Gon Freecss mengikuti Ujian Hunter untuk menemukan ayahnya, Ging Freecss. Bersama Killua, Kurapika, dan Leorio, petualangan berlanjut hingga ancaman semut mutan kanibal Chimera Ant.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Hunter x Hunter (2011)', titleType: 'romaji' },
      { locale: 'en-US', title: 'Hunter x Hunter', titleType: 'english' },
      { locale: 'ja-JP', title: 'HUNTER×HUNTER（2011年版）', titleType: 'japanese' },
    ],
  },

  // --- SPY X FAMILY ---
  {
    franchiseId: 'fr-spyfam',
    franchiseName: 'SPY x FAMILY',
    seasonNum: 1,
    id: 'anime-spyfam-s1',
    title: 'SPY x FAMILY Season 1',
    slug: 'spy-x-family-season-1',
    year: 2022,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Comedy', 'Action', 'Shounen'],
    synopsis: 'Mata-mata berkode Twilight membentuk keluarga palsu dengan nama Loid Forger untuk Operasi Strix. Tanpa diketahuinya, istrinya Yor adalah pembunuh bayaran, dan putrinya Anya adalah pembaca pikiran.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSvkRxHKfj.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'SPY x FAMILY Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'SPY x FAMILY Season 1', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-spyfam',
    franchiseName: 'SPY x FAMILY',
    seasonNum: 2,
    id: 'anime-spyfam-s2',
    title: 'SPY x FAMILY Season 2',
    slug: 'spy-x-family-season-2',
    year: 2023,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 12,
    airingStatus: 'completed',
    genres: ['Comedy', 'Action', 'Shounen'],
    synopsis: 'Keluarga Forger berlibur di kapal pesiar Princess Lorelei. Yor menjalankan misi rahasia melindungi klien dari serbuan pembunuh bayaran internasional.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b158927-lfO85WVguYgc.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/158927-zXtbXUO5iKzX.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'SPY x FAMILY Season 2', titleType: 'romaji' },
      { locale: 'en-US', title: 'SPY x FAMILY Season 2', titleType: 'english' },
    ],
  },

  // --- VINLAND SAGA ---
  {
    franchiseId: 'fr-vinland',
    franchiseName: 'Vinland Saga',
    seasonNum: 1,
    id: 'anime-vinland-s1',
    title: 'Vinland Saga Season 1',
    slug: 'vinland-saga-season-1',
    year: 2019,
    seasonPeriod: 'Summer',
    type: 'TV',
    episodesCount: 24,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Drama', 'Historical'],
    synopsis: 'Thorfinn muda tumbuh di medan perang bangsa Viking untuk membalas dendam kepada Askeladd yang membunuh ayahnya, Thors Si Troll Pepprangan.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101348-pivKKffCAwAY.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Vinland Saga Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Vinland Saga', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-vinland',
    franchiseName: 'Vinland Saga',
    seasonNum: 2,
    id: 'anime-vinland-s2',
    title: 'Vinland Saga Season 2 (Farmland Arc)',
    slug: 'vinland-saga-season-2',
    year: 2023,
    seasonPeriod: 'Winter',
    type: 'TV',
    episodesCount: 24,
    airingStatus: 'completed',
    genres: ['Action', 'Adventure', 'Drama', 'Historical'],
    synopsis: 'Thorfinn yang kehilangan tujuan hidup menjadi budak di perkebunan Ketil di Denmark. Bersama Einar, ia memulai perjalanan batin menuju penebusan dosa dan perdamaian sejati.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx136430-gsBsJjA7hGh9.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/136430-ktoFZnyubhHg.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Vinland Saga Season 2', titleType: 'romaji' },
      { locale: 'en-US', title: 'Vinland Saga Season 2', titleType: 'english' },
    ],
  },

  // --- HAIKYUU!! ---
  {
    franchiseId: 'fr-haikyuu',
    franchiseName: 'Haikyuu!!',
    seasonNum: 1,
    id: 'anime-haikyuu-s1',
    title: 'Haikyuu!! Season 1',
    slug: 'haikyuu-season-1',
    year: 2014,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Sports', 'School', 'Shounen'],
    synopsis: 'Shoyo Hinata yang bertubuh mungil bermimpi melompat melintasi jaring voli tinggi. Bergabung di SMA Karasuno, ia membentuk duet serangan kilat bersama rivalnya, Tobio Kageyama.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-ooZUyBe4ptp9.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20464-PpYjO9cPN1gs.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Haikyuu!! Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Haikyu!!', titleType: 'english' },
      { locale: 'ja-JP', title: 'ハイキュー!!', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-haikyuu',
    franchiseName: 'Haikyuu!!',
    seasonNum: 2,
    id: 'anime-haikyuu-s2',
    title: 'Haikyuu!! Season 2',
    slug: 'haikyuu-season-2',
    year: 2015,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Sports', 'School', 'Shounen'],
    synopsis: 'Tim Karasuno mengikuti kamp pelatihan ekspedisi Tokyo bersama Nekoma, Fukurodani, dan Shinzen untuk mengasah senjata baru menjelang Turnamen Musim Semi.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20992-aHgNbcalVEqk.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20992-QMdqxEjAIAit.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Haikyuu!! Second Season', titleType: 'romaji' },
      { locale: 'en-US', title: 'Haikyu!! Season 2', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-haikyuu',
    franchiseName: 'Haikyuu!!',
    seasonNum: 3,
    id: 'anime-haikyuu-s3',
    title: 'Haikyuu!! Season 3: Karasuno vs Shiratorizawa',
    slug: 'haikyuu-season-3-karasuno-vs-shiratorizawa',
    year: 2016,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 10,
    airingStatus: 'completed',
    genres: ['Sports', 'School', 'Shounen'],
    synopsis: 'Final perebutan tiket Kejuaraan Nasional Prefektur Miyagi: Gagak Karasuno menantang Juara Bertahan Elang Shiratorizawa yang dipimpin spiker kidal mematikan Ushijima Wakatoshi.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21698-RL71mr1YU5Io.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21698-jVFRIHAENS5B.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Haikyuu!!: Karasuno Koukou vs. Shiratorizawa Gakuen Koukou', titleType: 'romaji' },
      { locale: 'en-US', title: 'Haikyu!! Season 3', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-haikyuu',
    franchiseName: 'Haikyuu!!',
    seasonNum: 4,
    id: 'anime-haikyuu-movie-dumpster',
    title: 'Haikyuu!! The Dumpster Battle (Movie)',
    slug: 'haikyuu-the-dumpster-battle-movie',
    year: 2024,
    seasonPeriod: 'Winter',
    type: 'Movie',
    episodesCount: 1,
    airingStatus: 'completed',
    genres: ['Sports', 'School', 'Shounen'],
    synopsis: 'Pertandingan Tempat Pembuangan Sampah yang sesungguhnya di Stadion Metropolitan Tokyo Nasional: Karasuno vs Nekoma dalam duel hidup mati tanpa kesempatan tanding ulang.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153658-KVnjW77cQw3y.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/153658-7MePQPgSHrH1.jpg',
    canonStatus: 'Canon Movie',
    aliases: [
      { locale: 'ja-Latn', title: 'Gekijouban Haikyuu!! Gomi Suteba no Kessen', titleType: 'romaji' },
      { locale: 'en-US', title: 'Haikyu!! The Dumpster Battle', titleType: 'english' },
    ],
  },

  // --- RE:ZERO KARA HAJIMERU ISEKAI SEIKATSU ---
  {
    franchiseId: 'fr-rezero',
    franchiseName: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    seasonNum: 1,
    id: 'anime-rezero-s1',
    title: 'Re:Zero - Starting Life in Another World Season 1',
    slug: 're-zero-season-1',
    year: 2016,
    seasonPeriod: 'Spring',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Drama', 'Fantasy', 'Suspense', 'Isekai'],
    synopsis: 'Subaru Natsuki tiba-tiba terlempar ke dunia lain dan menemukan dirinya memiliki kemampuan mengerikan "Return by Death" — memutar balik waktu setiap kali ia tewas terbunuh.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-wRVUrGxpvIQQ.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21355-f9SjOfEJMk5P.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Re:Zero kara Hajimeru Isekai Seikatsu Season 1', titleType: 'romaji' },
      { locale: 'en-US', title: 'Re:Zero Season 1', titleType: 'english' },
      { locale: 'ja-JP', title: 'Re:ゼロから始める異世界生活', titleType: 'japanese' },
    ],
  },
  {
    franchiseId: 'fr-rezero',
    franchiseName: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    seasonNum: 2,
    id: 'anime-rezero-s2',
    title: 'Re:Zero - Starting Life in Another World Season 2',
    slug: 're-zero-season-2',
    year: 2020,
    seasonPeriod: 'Summer',
    type: 'TV',
    episodesCount: 25,
    airingStatus: 'completed',
    genres: ['Drama', 'Fantasy', 'Suspense', 'Isekai'],
    synopsis: 'Subaru menghadapi Ujian Tempat Suci (Sanctuary) dan berhadapan dengan Echidna sang Penyihir Keserakahan serta Great Rabbit pembawa keputusasaan.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108632-lQWnmw7XaNOK.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/108632-yeLbrgPN4Oni.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Re:Zero kara Hajimeru Isekai Seikatsu Season 2', titleType: 'romaji' },
      { locale: 'en-US', title: 'Re:Zero Season 2', titleType: 'english' },
    ],
  },
  {
    franchiseId: 'fr-rezero',
    franchiseName: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    seasonNum: 3,
    id: 'anime-rezero-s3',
    title: 'Re:Zero - Starting Life in Another World Season 3',
    slug: 're-zero-season-3',
    year: 2024,
    seasonPeriod: 'Fall',
    type: 'TV',
    episodesCount: 16,
    airingStatus: 'completed',
    genres: ['Drama', 'Fantasy', 'Suspense', 'Isekai'],
    synopsis: 'Kota Air Priestella diserang oleh para Uskup Agung Dosa Besar Witch Cult. Pertempuran perebutan kembali kota dimulai di bawah komando Subaru.',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163134-yieRFbvUOH9a.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163134-CqaXjXVivwJ5.jpg',
    canonStatus: 'Canon',
    aliases: [
      { locale: 'ja-Latn', title: 'Re:Zero kara Hajimeru Isekai Seikatsu Season 3', titleType: 'romaji' },
      { locale: 'en-US', title: 'Re:Zero Season 3', titleType: 'english' },
    ],
  },
];

// Build MAL data

// 88 Verified YouTube Video IDs from Muse Indonesia for Attack on Titan
export const AOT_YOUTUBE_VIDEOS = [
  "6-4Ft9_11xQ", "xkyFS7UxkBQ", "nZYOMfXxDlo", "ZFMXsD2Xjm8", "DfQcqPf90lI",
  "SgGID7r2C0Q", "3RnB8_H867c", "SdMxHaMxW10", "DMcxvNjdplE", "_iuAiyOzcBE",
  "lIEPK1Qn22k", "rf1z1emjFec", "rocUhtHJpSQ", "qwtn3lMSqrg", "-V2VhxdOzJQ",
  "LN0zYsmjwcA", "bht6_7FNQ1c", "QH3PXVEdYl4", "w5RXTm3ju4A", "N7Ra0wDTTa4",
  "1ApSruP6Wm8", "A5qZ63GXoAg", "dWU6VBq-e9I", "JBAyV9dnR6Y", "EGNzM6o44E8",
  "r4E2eChwueg", "fyhWaKXEtyk", "xNrb4GyEQek", "PWFXi9-1uME", "FBlYC2lV01o",
  "jda1KKHKMRg", "McCXPORmU3Q", "Ny-1Hw5tMB8", "dGTmprrEYEw", "eQwlHHjH_D0",
  "n0zrtKDasws", "YNB94_hwcq8", "sBtNHXONpts", "3EM0jmZreu8", "ZN5re-IqyW8",
  "IB7ZtanQToY", "s9PXjBzaQ1M", "82FzgM7IcXc", "0CSu0eRkJwg", "pTAJUDvQvNo",
  "q-AR2P9BeKk", "5u1fCaZ1DeU", "5yVBecAIHFY", "p0OuBGWRAnE", "zQnNhfw-2C4",
  "fqaQzMSQPd8", "eFCV7LfzJF4", "laogeuezJIs", "HRGzSjy4_t0", "DhB0irVWM0U",
  "9vjWlAu6ZNY", "PQUuI2_EYXc", "IsjYiBnxwhY", "5Geo0KLSxWU", "UZDp02Nlcik",
  "mtITeAFCwFk", "fHppngOI-cQ", "GWSiLfk88Mc", "orFvnkeZPVY", "rlOsiVaah10",
  "ZZp4ek1yAmU", "vzbmSTECWUY", "SQFw4uXRJYc", "4jyStuAafDk", "Q0gNA-uTWgQ",
  "o1qIIFNko_w", "nWAIQoIFq3A", "-BGVURjC5lg", "pmVBBCpCnRc", "9KFq4S9be54",
  "TfqDH1QXa_U", "sP9mWDsMPtw", "kVgKciHyGk0", "3Sn973Oo05g", "sdtdZuIl2qs",
  "VGM_JNfpwNw", "T20JvoTFkvI", "RQZjFIVgqI4", "hi5r9JU4EfI", "lAwtI66TuX8",
  "Zw5EofW4p8M", "3JUJJsQ3iKI", "sRhyIkc7_1Q"
];

export function buildMALCatalogData() {
  const animeList: any[] = [];
  const episodesList: any[] = [];
  const variantsList: any[] = [];
  const watchOrdersList: any[] = [];
  const seasonsList: any[] = [];

  // Track global episode offsets for Attack on Titan
  let aotGlobalIndex = 0;

  for (const item of MAL_SEASONS_CATALOG) {
    // Watch Order
    watchOrdersList.push({
      id: `wo-${item.id}`,
      franchiseId: item.franchiseId,
      franchiseName: item.franchiseName,
      orderNumber: item.seasonNum,
      animeId: item.id,
      title: item.title,
      slug: item.slug,
      year: item.year,
      type: item.type,
      canonStatus: item.canonStatus,
      episodesCount: item.episodesCount,
      note: item.title,
    });

    if (item.isExistingAnime) {
      if (item.id === 'anime-jujutsu') {
        // Generate missing episodes 13-23
        for (let ep = 13; ep <= 23; ep++) {
          const episodeId = `ep-jjk-${ep}`;
          const epDisplay = pad(ep);
          episodesList.push({
            id: episodeId,
            animeId: item.id,
            ordinal: ep,
            displayNumber: epDisplay,
            episodeType: 'standard',
            title: `Episode ${epDisplay}: Insiden Shibuya`,
            durationMinutes: 24,
            publishState: 'published',
            airedAt: `2023-10-01T00:00:00.000Z`,
            airingState: 'aired',
            subtitleState: 'available',
            watchabilityState: 'eligible_verified',
          });
        }
        // Generate scoped variants for ep 2..11 and 13..23 (zero collisions with Demon Slayer)
        for (let ep = 2; ep <= 23; ep++) {
          if (ep === 12) continue;
          const episodeId = `ep-jjk-${ep}`;
          // 720p Blogger
          variantsList.push({
            id: `var-jjk-s2-${ep}-blogger`,
            episodeId,
            providerId: 'prov-blogger',
            providerName: 'Google Stream (Blogger HD)',
            qualityLabel: '720p',
            sourceRef: `jjk-s2-ep-${ep}-blogger-720p`,
            embedUrl: `https://blogger.com/video.g?jjk_s2_ep_${ep}`,
            audioLocale: 'ja-JP',
            subtitleLocale: 'id-ID',
            priority: 12,
            verificationState: 'verified',
            moderationState: 'approved',
            lastCheckedAt: new Date().toISOString(),
          });
          // 720p Alpha
          variantsList.push({
            id: `var-jjk-s2-${ep}-alpha-sd`,
            episodeId,
            providerId: 'prov-alpha',
            providerName: 'Server Alpha (CDN JKT)',
            qualityLabel: '720p',
            sourceRef: `jjk-s2-ep-${ep}-alpha-720p`,
            embedUrl: `https://cdn-jkt.animehome.net/embed/jjk-s2-sd?ep=${ep}`,
            audioLocale: 'ja-JP',
            subtitleLocale: 'id-ID',
            priority: 10,
            verificationState: 'verified',
            moderationState: 'approved',
            lastCheckedAt: new Date().toISOString(),
          });
          // 1080p Alpha
          variantsList.push({
            id: `var-jjk-s2-${ep}-alpha-hd`,
            episodeId,
            providerId: 'prov-alpha',
            providerName: 'Server Alpha (CDN JKT)',
            qualityLabel: '1080p',
            sourceRef: `jjk-s2-ep-${ep}-alpha-1080p`,
            embedUrl: `https://cdn-jkt.animehome.net/embed/jjk-s2-hd?ep=${ep}`,
            audioLocale: 'ja-JP',
            subtitleLocale: 'id-ID',
            priority: 14,
            verificationState: 'verified',
            moderationState: 'approved',
            lastCheckedAt: new Date().toISOString(),
          });
          // 1080p Beta
          variantsList.push({
            id: `var-jjk-s2-${ep}-beta-fhd`,
            episodeId,
            providerId: 'prov-beta',
            providerName: 'Server Beta (FastStream)',
            qualityLabel: '1080p',
            sourceRef: `jjk-s2-ep-${ep}-beta-1080p`,
            embedUrl: `https://stream-sg.animehome.net/embed/jjk-s2-fhd?ep=${ep}`,
            audioLocale: 'ja-JP',
            subtitleLocale: 'id-ID',
            priority: 13,
            verificationState: 'verified',
            moderationState: 'approved',
            lastCheckedAt: new Date().toISOString(),
          });
        }
      }
      continue;
    }

    const animeObj = {
      id: item.id,
      canonicalTitle: item.title,
      slug: item.slug,
      mediaType: item.type,
      synopsis: item.synopsis,
      firstAirDate: `${item.year}-04-01`,
      year: item.year,
      seasonPeriod: item.seasonPeriod,
      maturityRating: 'PG-13',
      airingStatus: item.airingStatus,
      publishState: 'published',
      posterUrl: item.poster,
      bannerUrl: item.banner,
      genres: item.genres,
      aliases: item.aliases.map((a, i) => ({
        id: `t-${item.id}-${i}`,
        animeId: item.id,
        locale: a.locale,
        title: a.title,
        titleType: a.titleType,
        normalizedTitle: a.title.toLowerCase(),
      })),
      seasonReadinessState: item.airingStatus === 'airing' ? 'READY_ONGOING' : 'READY_COMPLETE',
      totalCanonicalEpisodes: item.episodesCount,
      scheduleWIB: item.scheduleWIB,
      officialPlatformName: item.franchiseId === 'fr-aot' ? 'Muse Asia / Muse Indonesia' : 'Crunchyroll / Muse Asia / Netflix',
      externalFreeWatchUrl: `https://myanimelist.net/anime/${item.slug}`,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-10T00:00:00.000Z',
    };
    animeList.push(animeObj);

    // Seasons readiness
    seasonsList.push({
      id: `season-${item.id}`,
      animeId: item.id,
      seasonNumber: item.seasonNum,
      title: item.title,
      year: item.year,
      seasonPeriod: item.seasonPeriod,
      canonicalEpisodesCount: item.episodesCount,
      airedEpisodesCount: item.episodesCount,
      verifiedEpisodesCount: item.episodesCount,
      missingEpisodes: [],
      readinessState: item.airingStatus === 'airing' ? 'READY_ONGOING' : 'READY_COMPLETE',
      licenseType: 'official_partner',
      officialPlatformName: item.franchiseId === 'fr-aot' ? 'Muse Indonesia Official' : 'Official Platform Partner',
      externalFreeWatchUrl: `https://myanimelist.net/anime/${item.slug}`,
      updatedAt: new Date().toISOString(),
    });

    const isAoT = item.franchiseId === 'fr-aot';

    // Generate episodes
    for (let ep = 1; ep <= item.episodesCount; ep++) {
      const epDisplay = pad(ep);
      const episodeId = isAoT 
        ? `ep-aot-s${item.seasonNum}-${ep}`
        : (item.id.startsWith('anime-') ? `ep-${item.id.slice(6)}-${ep}` : `ep-${item.id}-${ep}`);

      episodesList.push({
        id: episodeId,
        animeId: item.id,
        ordinal: ep,
        displayNumber: epDisplay,
        episodeType: 'standard',
        title: item.type === 'Movie' 
          ? `${item.title} (Full Movie)` 
          : (isAoT && ep === 1 && item.seasonNum === 1
              ? 'Episode 01: Kepadamu, 2000 Tahun Kemudian'
              : `Episode ${epDisplay}: Penayangan Resmi`),
        durationMinutes: item.type === 'Movie' ? 110 : 24,
        publishState: 'published',
        airedAt: `${item.year}-05-01T00:00:00.000Z`,
        airingState: 'aired',
        subtitleState: 'available',
        watchabilityState: 'eligible_verified',
      });

      if (isAoT) {
        // Attack on Titan Authentic Stream Generation
        const ytId = AOT_YOUTUBE_VIDEOS[aotGlobalIndex] || AOT_YOUTUBE_VIDEOS[87];
        aotGlobalIndex++;

        // 1. 720p Muse Indonesia (Primary stream - priority 15)
        variantsList.push({
          id: `var-${episodeId}-muse`,
          episodeId,
          providerId: 'prov-muse',
          providerName: 'Muse Official Stream',
          qualityLabel: '720p',
          sourceRef: `aot-s${item.seasonNum}-ep-${ep}-${ytId}`,
          embedUrl: `https://www.youtube.com/embed/${ytId}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 15,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 2. 720p Blogger Backup (priority 11)
        variantsList.push({
          id: `var-${episodeId}-blogger`,
          episodeId,
          providerId: 'prov-blogger',
          providerName: 'Google Stream (Blogger HD)',
          qualityLabel: '720p',
          sourceRef: `aot-s${item.seasonNum}-ep-${ep}-blogger-720p`,
          embedUrl: `https://blogger.com/video.g?aot_s${item.seasonNum}_ep_${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 11,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 3. 1080p Alpha (priority 14)
        variantsList.push({
          id: `var-${episodeId}-alpha-hd`,
          episodeId,
          providerId: 'prov-alpha',
          providerName: 'Server Alpha (CDN JKT)',
          qualityLabel: '1080p',
          sourceRef: `aot-s${item.seasonNum}-ep-${ep}-alpha-1080p`,
          embedUrl: `https://cdn-jkt.animehome.net/embed/aot-stream-hd?season=${item.seasonNum}&ep=${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 14,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 4. 1080p Beta (priority 13)
        variantsList.push({
          id: `var-${episodeId}-beta-fhd`,
          episodeId,
          providerId: 'prov-beta',
          providerName: 'Server Beta (FastStream)',
          qualityLabel: '1080p',
          sourceRef: `aot-s${item.seasonNum}-ep-${ep}-beta-1080p`,
          embedUrl: `https://stream-sg.animehome.net/embed/aot-stream-fhd?season=${item.seasonNum}&ep=${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 13,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });
      } else {
        // Standard Multi-Provider Scoped Streams (Zero Collisions & Zero Demon Slayer URLs)
        // 1. 720p Blogger (priority 12)
        variantsList.push({
          id: `var-${episodeId}-blogger`,
          episodeId,
          providerId: 'prov-blogger',
          providerName: 'Google Stream (Blogger HD)',
          qualityLabel: '720p',
          sourceRef: `${item.id}-ep-${ep}-blogger-720p`,
          embedUrl: `https://blogger.com/video.g?${item.id}_ep_${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 12,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 2. 720p Alpha (priority 10)
        variantsList.push({
          id: `var-${episodeId}-alpha-sd`,
          episodeId,
          providerId: 'prov-alpha',
          providerName: 'Server Alpha (CDN JKT)',
          qualityLabel: '720p',
          sourceRef: `${item.id}-ep-${ep}-alpha-720p`,
          embedUrl: `https://cdn-jkt.animehome.net/embed/${item.id}-sd?ep=${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 10,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 3. 1080p Alpha (priority 14)
        variantsList.push({
          id: `var-${episodeId}-alpha-hd`,
          episodeId,
          providerId: 'prov-alpha',
          providerName: 'Server Alpha (CDN JKT)',
          qualityLabel: '1080p',
          sourceRef: `${item.id}-ep-${ep}-alpha-1080p`,
          embedUrl: `https://cdn-jkt.animehome.net/embed/${item.id}-hd?ep=${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 14,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });

        // 4. 1080p Beta (priority 13)
        variantsList.push({
          id: `var-${episodeId}-beta-fhd`,
          episodeId,
          providerId: 'prov-beta',
          providerName: 'Server Beta (FastStream)',
          qualityLabel: '1080p',
          sourceRef: `${item.id}-ep-${ep}-beta-1080p`,
          embedUrl: `https://stream-sg.animehome.net/embed/${item.id}-fhd?ep=${ep}`,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: 13,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });
      }
    }
  }

  return { animeList, episodesList, variantsList, watchOrdersList, seasonsList };
}

export const FRANCHISES_DEF = MAL_SEASONS_CATALOG;
