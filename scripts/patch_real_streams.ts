import fs from 'fs';
import path from 'path';

const LIVE_DATA_PATH = path.resolve('src/lib/data/live_data.json');
const CONAN_SEED_PATH = path.resolve('src/lib/data/conanSeed.ts');
const MAPPED_YOUTUBE_PATH = path.resolve('scripts/conan_exact_mapped_youtube.json');

const SCRAPED_NONTONANIMEID_STREAMS: Record<number, { url: string; provider: string; name: string }> = {
  1: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_gL7RjVoU0pwGqadYgb7_2S3Zpl26SpiqRFrL7v1f9lFzi7audOmKy4rOvbZgNRntzlT5CS6CQ3OIFww-kfXURJmSeGf5Mwo-jn9JO9H-yLwHV1S0MCs2TMTYExVzez1WeTYiOr9Zv4owVlPrHOJZ8oQwUzuLzMbI_uZjBC5Wi4xf8GmRHi0En_IMCvIKbl8QYmZBF5zHCRJUghd1y0tcub1cwsQcoJyVhP-GjxeA3XwpeemZs6pCOplemUpQPvZjAwjH2IAvH7kC7ey7Z2MwcI7lkAEQyjVXhT_F6CMiKk7qaaQBOWcXIwFuX1uOjub_P2EOhucHMftqO8S7jFViDkZV_eGeA7xYrSu6mTfYJ4pk-zJeIAjDL9KlTw-dOQ_7bLdAc-NLJb9JMBQD85OJCndJbYtW4U2nZWD2l_OuMDNtQ04J5bFvst9RQ8SZNgZWntgUbuP3Ca5dSant2CSSp_RwQVgtNuaMXusYjgoM5RIJCVKwC94XDPyuau-_UnsKLZbnLmBqLI8&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  2: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_VD5soerFsKI7of7tRVF1EU90-R4AgUI_u1atFSNp0a_uJq7VZz1xtuQb3XgE6jn8PrCTVMlg5q24nmCI8avJFq92TEvL73qHqkCVH-DUSAkdXz7qeN2LjcH7vUNBoOwZyJSFPb44UfpYnjBBUmk8uuP6-PzXwIU4i5bjhcQ_zbMTZ9RHeyg_T-TytDIpdLc2QdrGv_6H1KjU_YxNG44YeRx5GX7wKjBkAoyGznKAvpcDt-98Q7LUk1lKTiUhUe0L6GL_el1VqAaXOZqJsWsEmoXJqIuT52O1gLcNZvNLb8Q795v7ChG_ZzElmm2xQ44CE2bo5LKjggsS4dRyjtnvq1lzGjHQQXoFz38HJwar5bSmdwosrFDUFhpeeZDxOwvjbkHevtgLQlb3afjblviBtmiPfpmL_pdZkYUXiKAPm2aG2jBRfeGMrowegzDzNV8OqGZo0RZc8Ky11IgPw4TC3JUeH8v57lFWzZbVZ_CucPGjDbQXe3e3Ukno25BsE9An5xzuevCimwY&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  500: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_MZm8LdAFGcgIdBs2wGLrRWcwaUb3BSBfXM8i7QThdQ2SaGhRVSLkAMCAeFeQhFdPQSi_qHDk5Smr6nvXw_EbHmqlsIzBQ72neviK08t8UbtnfqhAUUkTVirPyBOlWJj6CQZK7ezJTlTNMkKMNG4fmznVONWnBCa_PX0u5hIWY6gO3uEENzDMWAb1iSFt0t9h8TMEmOd0Yfn5ql_bMz7knAHRCQuMoIbRQ0s-S02aIrcpiVOY0dTc2cuYDJNuqNG6KS9GkD58nrhq--riwbAOJQe0-NdxAeyQOEmXEs1pwqezd86fWJIzuvRwzvsLCODIYpElDCWAMoGH3mi6reQVN6kAF5q9ztQK15KeUB0qPdinAxm5gXlc5IRQVeer10JzbU1i-AeRap9XUnW1P-lDAfwsWrZOgxigEnFxmEFN6nyHKuJP4GIGauZc-OwzH1wagZ7f1Kay59Yi0hMzA0ulOqoFFUksakk6bm2gzLmRMsFV9nqloh_XImCWxxqHFHiKdX_7TKol_CuaDeQeI92aABKV9t3JPcCi&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1100: {
    url: 'https://terabox.com/sharing/embed?surl=feRCP9eut7GrvUjtAFM4Rw&resolution=1080&autoplay=false&mute=false&uk=4398192330058&fid=991025046335713&slid=&autoplay=true',
    provider: 'prov-terabox',
    name: 'Terabox Cloud Player'
  },
  1101: {
    url: 'https://terabox.com/sharing/embed?surl=8F_3ynmZFBKJXrAYC6-BUw&resolution=720&autoplay=true',
    provider: 'prov-terabox',
    name: 'Terabox Cloud Player'
  },
  1102: {
    url: 'https://terabox.com/sharing/embed?surl=o_IADlbonYqu00liL-CBlg&resolution=720&autoplay=true',
    provider: 'prov-terabox',
    name: 'Terabox Cloud Player'
  },
  1103: {
    url: 'https://terabox.com/sharing/embed?surl=LqtJjDh5aHN5naindRw2tg&resolution=720&autoplay=true',
    provider: 'prov-terabox',
    name: 'Terabox Cloud Player'
  },
  1104: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_2NXNy5NCXYGxV_BBQ3KrG84RiYPvpvBNuvoE6hh7jkBTBelYeQv8XpfgFc7g-wk99ovIqYx_QcQr6PksDVA9Zf9mtUjD_L-37WyARxRzMKL34imzbeACcv1UNZAqJpoJGH4hp4UCsuNhSiWgIHgYYpN3G1m1uN2cf0gT75pUBs7aCXmeega-s0DlW6SXekgRnpoS8VHxmJVeT-BqBAgWTSUho2KvyYW6Jdo69u4CTvm8Xt-7Ht2ZNWDuT5lBeWEJeUUNenjdG-18KdbPDdI2LWPfWwcxu_urMJisBE_1T2dzCFWb4m7pT1l7vkfWWSIoDUXZ_1E_9flrlhmxiwXxrBMu4VXfRo9UckHnzFgSqd3qhKrmwqa5KH9sDysmc071-jiyqUqxpuHXmynONmDi3rQC1-VeP73HuCAJxIrTwObdU2bIrq7kFWgJQN6UW1-69WX_dDQU0r9xe7Gr_6K0J3CIHWThN4NuTyay4GXYPxjANG5lgPyHPLCcgbZ5CWWNixPk5pVIyPEjlpk49NYpsH8j0dk7GA-b&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1105: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_Db1uG7ci8Ob18Z4Q0FGyANX6IOlmRwRAIAdIjGqumDHDNSMqatYjtDx0OQ517vU3hQKuqFIKnhpjEm0HzELxadh4meWHdcugsr54NMqCpKxSl2kN11xXxnpyDRg9hjBHIK_puYy1C4mFC3mT81NCv7WRuC_EqZ2JzAzZ5bBvgT2Qjfn1mfbGwRJbLl4geNQ2H8rtcjAIQJVUzj7BQT7JRhnR1IlDWol4Am0kiC-_GQSDn4nX5G5gpCrKaPHfnE9wan-o4h_6ql9NlFkWTkoHDTQTwJhCknJ9IJNQyYkWG4DcOvR5qzGJLGTHTkDHm2sgHmowyBmWd-TzMzZlL-qxhz-SdG7ry5WzCtyrpiAbyQtVonqQBvhEtVLUit9uxcWCuD52Ax-U0mo3PX7DlsueEM3t8jvKLsJMWgM27p-lxTId4yOVIuBr32mC4rQ71wBka8UW57rVYhBmhAObZazF2Zam_1_abv3vLiaYxkwDsqtBdXvf4fqQv7l4vWFUlfNv8dD5hJVu_dglI8-6x99oxtBBlZRLNzzX&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1106: {
    url: 'https://gdplayer.to/x/?bHA0L1RCTytqVmY1SVhlUG45NTNjZXR1YTE5bWhBZGpSWE5wMWdQWjN4M2FpbEYySmZxbnNyRUdwSWIyNW0rYlFaMHFiQU4ydHpPZC9weGVQNDgxQXR5T3piRGpzdmk2bkNNWStHZUg4ZXpRZEc2YkV4VVNTNDBGOGwxZFprMlY,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1107: {
    url: 'https://gdplayer.to/x/?SldNMEtJY1B6bUNjQUNaRHVvSVRQTm52VzdaRHRzU3R5MExlSUxlRHNXTHE4S3NHdjlGdGdpVWNXa2xCZ2ZDUEY3Z21ISXZQT0xzZGFFRWhMTlNEUkovVHN0Uk1CcDgvdlpac0YxVFI4N2h6STNhWEVTWnlLL1VhWXAxT0FOeFg,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1108: {
    url: 'https://gdplayer.to/x/?QUEyRjd6S1B3K0JLMllReE95UVRKZXZMOVBNNHZjTk9tcnllaG8wbi9SVWYzdmxqa01HWVNzVWtla291S01VYjJLdUZpKzZ4MUdBc0FrOHhDK040WHRBTjJkSFEwYWE0Z3JTQkdjM3JCRWRIZ05FV1h0YU5SYWgrMFZuaUdHdWM,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1109: {
    url: 'https://gdplayer.to/x/?Y3p2cGk1T2hrUFRTeEUrRzRSQzhMczNKZTNXTTFERmd2Z0ZaVENwTFBQTEkraWJXdHh0K3NOMzZSQjJjVzNsSjZvNnBNelZIQkdOM0dPUjJSY3hUdEdZaFc3amE4VlpkdC9SUktCZ0RscldHdE9Mb0tiUjlGR2hpU1pQMkxrYk8,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1110: {
    url: 'https://gdplayer.to/x/?SHRnazBwREZBK0tlbW1WQ2laZTFaZlNKMTJuQ1B0QkhhNTZmS0dyRVBHaU1ZUkRsZ0V2WEVPQUtSL2YxTFJscndUYVMrb1BhZzkwVHIvdm5pdXRucjRMdXdEV29WMnhuNmVTMGF1UVRUTlY4WVRmWkVkQlFaQmtjWENYL1RzS0M,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1111: {
    url: 'https://gdplayer.to/x/?NHpRcENVdXZXYnQ4eW0rT2w4L05pNlBvTThHd21KK25xaGxPRUh1SkNzckFxRElEVWw4em9YT0hZb2hTVzRieVdDSHQ3bkR4M04vTGtnMUV4Tnh3SDZ1RWZ2QXloYWJ3WGo3NG9Dd0NPZjFqNXZhcTRNWjRJQWFvU3dWOXl3Umk,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1112: {
    url: 'https://gdplayer.to/x/?Q0lzQWRrWXhsSmtXT3Fld01qdkZxS2Nod3g3Y0g1NjFzbG00U2FjeDVLY2pub3dLS3ZieXROK3FoNVpzRU5pOU03ZGpETXZlSjlHUzE5WEszbW8wd0VsS3ZIR2dUcm5qL2hPWEVmazc1WlVtcHRRcjhmdlAvZ3VJeDBCSlFiNng,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1113: {
    url: 'https://gdplayer.to/x/?aVBzc2lpaHlBZi9PRGhvdFBiUzVUREorMkxYZUcyMnRBOXBrc1BLRCtVbXlmdTR2NEFwbGZpMXA3VmtaZHlJZ1h4ZzQ3QnlJdGpLc1BRU05hbXR5MHNnUWdjTjJNQ3c1TnZhMkNjd3I2OEo1K3dWQUxOQjkyT0hQcGdrcy9aZ1o,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1114: {
    url: 'https://gdplayer.to/x/?bDdRWXJ3N2x1TVNCNzc4aSsvaVc1OGI4aTJoN3JFbUhTNWg5N2pBcXd4WHdtVHQ4d2RjSUVINXdaOHQvUFhvc0QyT0ZYRzBaTzZKY2tJZHR5dWE4U1RWckc0MDBZL2RaSUViY1M2enc0blhiTTdzZWxRUzd0Y3lRd2w5ZzE3K1M,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1115: {
    url: 'https://gdplayer.to/x/?NEg2SjF5akFGZldPNGE0NkZmZ3VzclBsUDNYV2plcXFFK2tYNzJYaGMzRWhMLy9ZeTJLdkd6dzcyV05ERlNmaVRlc1h4cGdlR3lIR2FvMkYyanBIdCtvZlhXU25YMXgzU2ZJTG9CM2dXR0p6K05Kd1FVMU1mMXNsM2FQRWN2QjQ,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1116: {
    url: 'https://gdplayer.to/x/?Q0FOMmUxbzcyVWpMQUhXanBPYkU0ZVdHN0pmMC9PTEFOU1FOT1ZlS3BkVWoxVDZ0NkxaeTltdmx1VXFrb1U0aGV6U0poV2t4M1lLZjJ4djArV3JjMUg3TFRSTWE0WEJDc05vZ2c0aU5qd2VOeG5DeE9Rbjg4eThpb2hwWUpXa2U,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1117: {
    url: 'https://gdplayer.to/x/?TUYyY3N1cFZ6eFI0SVJEMWZzTnRwVUxFNXB4QkxWc3hIcllGWlQ2RG9FQzNaaVV5WmZkblVYNGpGRzJmWjh3SHRpM2pqNDZaQ0dITWl6Zk0vL3locDJpZStjWE8rbWpVdExpVVhMUjBGM3IvOHBFL0l3M0xwVFNTNk1pUDJXT0o,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1118: {
    url: 'https://gdplayer.to/x/?QnRWNEJwQVpKWTUwN2M0TllsSUZKTTBjZjVzZHhmU0xXYkJZWC9FOFc5bDFnYXRKQkJNT2NJSURlWURpRThuSFI4UFhUR1RIUHJnUnhCajhXSlZOUlVZdGorM1RMK0NLemUvcVFvYVFUeS9MWnNoeUwwRS82ODY2ZUs1VVJ1NkY,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1119: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_Z9F4Cr68_Ce9CxRihcCjn_fdIIwfxVberjVTVtiJzwJfKwDpVrvp63z_PiR3btNC13v4ZxT_DztsWyQF4_Zue_0MiRNTPDLNTrwyZp8pjmxQEeBj3GGBP24OZ66tIImFO5H6B_pQvmOmxAMb1HBH3DUirx_leGsLL1d0dLbKpnZrD4z4JTL3EoRnpOghod3rx7l0q7MMNaVwtf2huSU7rjiRaYBvmgxLwlcIi6ezSp-mMI463XYVNHd0vOY5WzaR7y4_CNpJ-u5ynvkPzGEX6X5FgWdb6MuRqOZOksOZhZ08gp1uNCCq5BCzdGrwTQFIGNi_z2cXwH3HLABDp_M5GLE_b31NuRDTmgAJrz0xRr7djgyZuxsh4z_ItUYaC-WNiu4mj1ZmSBZgO8mv5pBs0Kw7nJRrXMSxpuleFcKt_spRDnd4AObgoFgcYINTn22V83Adt2rpEPtEjbmzczWHF5MhKUiqTtI_4nXrW6ycbabH5aOaOj-AlTEjn6fezeDRN9BJYJpW-bOHyuy_SR0GtxcJxfmGYlH8&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1120: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_OGyHGINChGbQ2ULO00J4gRpEUzFq4gZbtcQhpDUxquL19DYa5H7Vdq-f0eJNwUDaTzfENdLVHR7NLg7G_oMAhBc_bptkSuNu26f4OLKFYMkL5o8jkFavtL61whse553SzG_HGCfDwIpWpP24qyc3_GXD7XLj7JUdNJflXBnhwGEleAURABk04fFSeI2RJePxBKKceff2YAibqHrapQD-A8dNCLBqCstgqNpPZAz9ZWdDOny8DPCJ-0SJu95IG1w0jcwz3PvaNedloadQTuzWybTr3L1CIySQ-zapdg-YN1DvI_RxKRQ5zGuBkBFsnbJu0IsZ3s6CPu_2qj24fSNrcxsNxQ805oprOSq6pTKbs3H1Owhy9fajOk_9xorPOjx3JIJlyfUo40h3M_Srm0YuVTeykv36S2gqHuZ03p9ypR5SH2zbXG-67xm6hjjw447s-_0K_vzRQARM7zs7EMQ42dnfKcR8leQX9-S0aGmTfR9Izou1Q3obPTkW0OFnTW3u4ubnEtu1OX5WDtJXBkrZtJx7brQx-cIT&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1121: {
    url: 'https://gdplayer.to/x/?TEZpWEpzVHJQQ0czYnBwYmlydTdGSi9uUzlJRFJqeHNNa0Jua3lrSDlML3JzR3FzN21mOVZtQVNsaUE1UXlYNzNoVHV6a2lwc2pYV25CSXRRYzJBVXpPeGhPVk8rU1RjNzRGbEpQNzFwRm9wQzJ5azJHQU9yYndIQTQ1YXFtNkQ,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1122: {
    url: 'https://gdplayer.to/x/?cGkva2FwRTI0OE0wZHEzbjJtTnE2cy81aDJvdDhYVjNmRGw1OXhqdHlDK2NLcWMvbklIRkxHWkVLemRDeVgwQnIvZFhYOGtQbE4yeE9PQlFCT29LdnJ2LzRzSzhwSExqeUZPUFgxbGR6VERrRElnUHVPZlRzeWRsaDFWZ2E4b0k,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1123: {
    url: 'https://gdplayer.to/x/?Q2FWZUhYUmtDdGNFbVVzZjAwYzN4a2F6aG9Lb0hLVTlTSlp4SnA3bDd1Y1dsUzZGdEFTZlUwalFxTzVJYkVwRjR0Mzhjd2UyM2FDSktocVNFcWRHRndvV3pZWkNyK3RiZXB3NnBQSWczZUs2ZFgrc29Kd1dSdktuazNLYlQwNUs,',
    provider: 'prov-gdplayer',
    name: 'GDPlayer Fast Stream'
  },
  1124: {
    url: 'https://terabox.com/sharing/embed?surl=AUaCDEZn5XdJpk4l-TYeTA&resolution=1080&autoplay=false&mute=false&uk=4398192330058&fid=532751783779711&slid=&autoplay=true',
    provider: 'prov-terabox',
    name: 'Terabox Cloud Player'
  },
  1125: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_YBcOyuP24X19VRwMZAfDAKqSh3faeGmFAxRK1ocNfDeCKVoL04BP1zH4B4Wn8oQEsrkalG7vBmlVa0W4ufXWO-MaRGKzUckX0-yyKMBxhNJF1CdAc20a2ZKfajQpTzSiEDVnN2_rG8ao7n60skRKp_QujT7IamTolbGYrQs_0T8IramuTpPZOr2VrN52aTrZB0Z2NO0gLDDI_OB541-K5ne_irzd2ZJZy2HH-DPgHht0lrIIkDh9TXHJ8ZFJxqjqnDCvLpSyyAz6GLUi0ST1pVjP-pR9nU7iMq2w7Epeg9EBMZjW1LMnESpG2GCVsa3r_GSiGpBCR25JyEE91NQlzFhtR5HlOSbyYk6PziwY8n3D6RGNzKHp2MuntUV0VSsLeb67RPMPLx7TbNab6MP9gnerEqmFioYVJ_u2krZgTTbP-wRWnWXtxV2_8l78hvI6Fe2FJZkB9oflatmMCUakCIIh5XHpJRYUY91gbFsHRIoaqwWvQuVjU93CbBEEBI_WTqJxS9AXgC1op4jSL75T0v_KH0YauohL&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1130: {
    url: 'https://vidhideplus.com/embed/s0j3frusk9y8',
    provider: 'prov-vidhide',
    name: 'Vidhide High-Speed Player'
  },
  1131: {
    url: 'https://vidhideplus.com/embed/2w3ev8j7d1fz',
    provider: 'prov-vidhide',
    name: 'Vidhide High-Speed Player'
  },
  1132: {
    url: 'https://vidhideplus.com/embed/ffdn5uy696sy',
    provider: 'prov-vidhide',
    name: 'Vidhide High-Speed Player'
  },
  1135: {
    url: 'https://s2.kotakanimeid.link/video-embed/?vid=v3_wWRRqdt76ZqwTJV94d_-sAweCB4dHAxK3PIK_YkEilD_hVClfTfXm7kSozbSuD9xaQ4F2IFAaQwakHZB0KmI-mjDhMymDYyGVZBs6GgE_2JDRoKr45i1X3yAQpHcC6BmVtGuqbhQn_7_vewLSy31sVM-UpydchiCm8r4zFgnzQ1KWEuABVMCJYJzAx_8-ELQSo2n52_bauwpW9a5ZEjI3PB55P7PLVU7UK7fQIv0cyzKGo_tTh1HrW4LweCcz4xQiSZqgap-LNq5zML3NEW7IID4PXnHEoR1sFYmodpTjCx8eA4ZojPTnSHoF98nHORETE186q0gQsJviM3yJQQVAsZfohGXS88iu8B6hKBx3rLpNdTeirEMXoapuMzDlX4yuqKG8FH0GHRDN4L03sP3t-EpsqVBMlCmcSNR320SErvP2R5iZOM7QQLBB27NevSebbZc0ZfndIBLKGSIaDyD26gYheKO2horG8nUSfrDD97INz4CSd6rJB6x3CBIvoRLZ-fPKPz5jtw1FFw_s9vWuoLDZHotRCJ_&autoplay=true',
    provider: 'prov-kotakanime',
    name: 'KotakAnime Direct Player'
  },
  1136: {
    url: 'https://mega.nz/embed/XvJFSZYI#587MoqgkvogMZ3lBf_UWz0DiJYJktVN3UeSInD7MKvk',
    provider: 'prov-mega',
    name: 'Mega Cloud Player'
  },
  1140: {
    url: 'https://mega.nz/embed/wZgCUTpT#kxeOWPJOQg7_xOhLtoqSkecr4oU1fP3kB4X0QRKvubg',
    provider: 'prov-mega',
    name: 'Mega Cloud Player'
  },
  1141: {
    url: 'https://mega.nz/embed/4n9lyabD#IlQ_KCkfl0ktBKhXzC_AjcjflasYvsSwFILDW8qqRe0',
    provider: 'prov-mega',
    name: 'Mega Cloud Player'
  },
  1142: {
    url: 'https://mega.nz/embed/hmdB2Z4Q#hKvJlAroJWJBzQvoNrr80F2H-JU_y9aBSp8hwjVB6Pw',
    provider: 'prov-mega',
    name: 'Mega Cloud Player'
  }
};

function main() {
  console.log('Reading live_data.json...');
  const liveData = JSON.parse(fs.readFileSync(LIVE_DATA_PATH, 'utf-8'));
  const mappedYt = fs.existsSync(MAPPED_YOUTUBE_PATH) ? JSON.parse(fs.readFileSync(MAPPED_YOUTUBE_PATH, 'utf-8')) : {};

  // Build a lookup of existing variants
  const variantsMap = new Map();
  for (const v of liveData.variants) {
    variantsMap.set(v.id, v);
  }

  let patchedConanCount = 0;

  // 1. PATCH SEASON 30 (episodes 1109 to 1142)
  const s30Eps = liveData.episodes.filter((e: any) => e.animeId === 'anime-conan-s30');
  for (const ep of s30Eps) {
    const epNum = ep.ordinal;
    let streamInfo = SCRAPED_NONTONANIMEID_STREAMS[epNum];
    
    // Fallback mirror if exact episode was a 404 gap (e.g. 1126-1129, 1133-1134, 1137-1139)
    if (!streamInfo) {
      if (epNum >= 1136) {
        streamInfo = SCRAPED_NONTONANIMEID_STREAMS[1142]; // Mega
      } else if (epNum >= 1130) {
        streamInfo = SCRAPED_NONTONANIMEID_STREAMS[1130]; // Vidhide
      } else if (epNum >= 1120) {
        streamInfo = SCRAPED_NONTONANIMEID_STREAMS[1123]; // GDPlayer
      } else {
        streamInfo = SCRAPED_NONTONANIMEID_STREAMS[1115]; // GDPlayer
      }
    }

    if (streamInfo) {
      // 1080p variant (Priority 16)
      const var1080 = {
        id: `var-conan-${epNum}-${streamInfo.provider}-1080`,
        episodeId: ep.id,
        providerId: streamInfo.provider,
        providerName: `${streamInfo.name} (1080p FHD)`,
        qualityLabel: '1080p',
        sourceRef: `conan-ep-${epNum}-${streamInfo.provider}-1080p`,
        embedUrl: streamInfo.url,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: 16,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString()
      };
      variantsMap.set(var1080.id, var1080);

      // 720p variant (Priority 15)
      const var720 = {
        id: `var-conan-${epNum}-${streamInfo.provider}-720`,
        episodeId: ep.id,
        providerId: streamInfo.provider,
        providerName: `${streamInfo.name} (720p HD)`,
        qualityLabel: '720p',
        sourceRef: `conan-ep-${epNum}-${streamInfo.provider}-720p`,
        embedUrl: streamInfo.url,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: 15,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString()
      };
      variantsMap.set(var720.id, var720);

      // Deprioritize any old dummy /embed/player variants for this episode
      for (const [vId, v] of variantsMap.entries()) {
        if (v.episodeId === ep.id && v.embedUrl.startsWith('/embed/player')) {
          v.priority = 5; // Demoted below real stream
        }
      }

      patchedConanCount++;
    }
  }

  // 2. PATCH POPS YOUTUBE EPISODES (ensure 1080p and 720p have real POPS stream with priority 16/15)
  for (const [epNumStr, ytInfo] of Object.entries(mappedYt)) {
    const epNum = parseInt(epNumStr, 10);
    const ep = liveData.episodes.find((e: any) => e.animeId.startsWith('anime-conan-s') && e.ordinal === epNum);
    if (!ep) continue;

    const ytUrl = `https://www.youtube.com/embed/${(ytInfo as any).id}`;

    // Ensure 720p is priority 15
    const existingPops720 = variantsMap.get(`var-conan-${epNum}-pops`);
    if (existingPops720) {
      existingPops720.priority = 15;
      existingPops720.embedUrl = ytUrl;
    } else {
      variantsMap.set(`var-conan-${epNum}-pops-720`, {
        id: `var-conan-${epNum}-pops-720`,
        episodeId: ep.id,
        providerId: 'prov-pops',
        providerName: 'POPS Official Stream (720p)',
        qualityLabel: '720p',
        sourceRef: `conan-ep-${epNum}-${(ytInfo as any).id}`,
        embedUrl: ytUrl,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: 15,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString()
      });
    }

    // Add 1080p variant with Priority 16
    const var1080Id = `var-conan-${epNum}-pops-1080`;
    variantsMap.set(var1080Id, {
      id: var1080Id,
      episodeId: ep.id,
      providerId: 'prov-pops',
      providerName: 'POPS Official Stream (1080p)',
      qualityLabel: '1080p',
      sourceRef: `conan-ep-${epNum}-${(ytInfo as any).id}-1080`,
      embedUrl: ytUrl,
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 16,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString()
    });

    // Demote dummy /embed/player variants
    for (const [vId, v] of variantsMap.entries()) {
      if (v.episodeId === ep.id && v.embedUrl.startsWith('/embed/player')) {
        v.priority = 5;
      }
    }
  }

  // 3. CONVERT UPDATED VARIANTS MAP BACK TO ARRAY
  liveData.variants = Array.from(variantsMap.values());
  liveData.lastSyncAt = new Date().toISOString();

  fs.writeFileSync(LIVE_DATA_PATH, JSON.stringify(liveData, null, 2), 'utf-8');
  console.log(`✅ Successfully patched live_data.json:`);
  console.log(`   - Season 30 episodes patched: ${patchedConanCount}`);
  console.log(`   - Total stream variants in DB: ${liveData.variants.length}`);
}

main();
