# Echoes of the Forest

**Echoes of the Forest** — 2D Metroidvania / Action-Adventure janridagi hikoyali, yuqori sifatli va ekspert darajadagi platformer o‘yini.

![Echoes of the Forest](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Linux-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Built With](https://img.shields.io/badge/Built%20With-TypeScript%20%7C%20Vite%20%7C%20HTML5%20Canvas-orange)

---

## 1. Loyiha pasporti va umumiy ma’lumotlar

- **Loyiha nomi:** Echoes of the Forest
- **Janr:** Hikoyali 2D Metroidvania / Action-Adventure
- **Murakkablik darajasi:** Ekspert
- **Asosiy konsepsiya:** Qahramon o‘zaro bog‘langan yagona dunyoni o‘rganadi, yangi qobiliyatlar egallaydi, avval yopiq bo‘lgan hududlarga qaytadi (backtracking), hikoya sirlarini ochadi, mustaqil harakatlanuvchi avtonom Jangchi Bot (AI Duelist) bilan bellashadi va ko‘p bosqichli bosslarni yengadi.
- **Hajm:** 28 ta xona (kamida 25+ xona talabi to'liq bajarilgan), 4 ta asosiy qobiliyat, 8 ta noyob dushman turi, 4 ta ko‘p bosqichli boss, 10 ta quest (5 asosiy, 5 qo‘shimcha), 10 ta yutuq (achievements) va 2 ta muqobil yakun (Normal & True Secret Ending).

---

## 2. Boshqaruv va Input tizimi

Input Abstraction Layer orqali klaviatura va geympad uchun to‘liq qo‘llab-quvvatlash yaratilgan.

| Tugma | Harakat | Izoh |
| :--- | :--- | :--- |
| **A / D** | Harakatlanish | Chapga / O‘ngga yugurish |
| **W / S** | Yo‘nalish / Tirmashish | Devorga yopishish va sirpanish |
| **Space** | Sakrash / Double Jump / Wall Jump | Variable jump height (ushlab turishga qarab balandlik o'zgaradi) |
| **J** | Asosiy hujum | 3 zarbali kombinatsiya (combo chain) |
| **K** | Dash (Shamol siljishi) | **0s Cooldown!** Gorizontal tezkor siljish va qisqa daxlsizlik (i-frame) |
| **Q** | Maxsus hujum (Special Attack) | Tosh devorlarni yoradi, dushman qalqonini teshib o'tadi |
| **E** | O‘zaro ta’sir (Interact) | NPC dialog, Save Point, lore o'qish |
| **M / Tab**| Dunyo Xaritasi / Inventar / Quest Log | Fog-of-war xarita, questlar va to'plangan lore |
| **Esc** | Pauza menyusi | Sozlamalar va asosiy menyu |

### Ekspert platformer fizikasi
- **Coyote Time (0.12s):** Platforma chetidan tushgandan so'ng sakrash imkoniyati.
- **Jump Buffering (0.10s):** Yerga tegishdan oldin Space bosilsa, yerga tegishi bilan sakrash ijro etiladi.
- **Dash-Cancel:** Asosiy hujum (J) ning tiklanish kadrlarini Dash (K) bilan darhol uzish va yangi pozitsiyaga o'tish mumkin.

---

## 3. Vaqtsiz (Cooldownsiz) Qobiliyatlar

1. **Double Jump (Space):** Kutish taymerisiz (0s cooldown). Havoda istalgan payt tezkor ijro etiladi.
2. **Dash (K):** Kutish taymerisiz (0s cooldown). Ketma-ket birinchi dash to'liq 0.16s daxlsizlik (i-frame) beradi, ketma-ket spam qilinganda daxlsizlik kamayib (diminishing i-frames), harakat tezligi saqlanadi.
3. **Wall Climb (W/S + Space):** Stamina va vaqt cheklovisiz devorga yopishish, sirpanish va devordan sakrash.
4. **Maxsus Hujum (Q):** Taymer o‘rniga real jang riski: 0.25s tayyorlanish (startup) va 0.22s tiklanish (recovery) oynasi. Yoriqli tosh to'siqlarni sindiradi.

---

## 4. Avtonom va Realistik Jangchi Bot (AI Duelist)

O'yinda ikkita rejimda realistik Jangchi Bot mavjud:
- **1v1 Duel Arenasi:** Asosiy menyudan va Mashg'ulot Ziyoratgohidan to'g'ridan-to'g'ri kiriladi. Uchta qiyinchilik darajasi mavjud:
  - **O'quvchi (Apprentice):** 120 HP, 280–340 ms reaksiya, 25% tabiiy xato.
  - **Usta (Master):** 180 HP, 200–250 ms reaksiya, masofa o'yini (spacing & baiting), Whiff Punish.
  - **Ekspert (Expert):** 240 HP, 150–190 ms insoniy reaksiya oynasi, qisqa muddatli adaptiv xotira (o'yinchi spamiga qarshi chora ko'radi), havo jangi va Dash-Cancel.
- **Shared Controller & Physics:** Bot hech qanday sun'iy teleport yoki g'irromliksiz, xuddi qahramon kabi yagona PlayerController fizikasi va platformer NavGraph orqali harakatlanadi.
- **Combat Feel:**
  - **Weapon Clash:** Bir vaqtda (0.08s farq bilan) zarba berilganda qilichlar to'qnashadi, metall jaranglaydi, 65ms hitstop va ikkala jangchi orqaga suriladi.
  - **Perfect Dodge:** Zarba kelishiga 0.12s qolganda Dash qilinsa sekinlashtirilgan kadr (slow-motion), afterimage soyasi va kontr-hujum oynasi paydo bo'ladi.

---

## 5. Dunyo tuzilishi va 4 ta Biom (28 ta xona)

1. **Sokin O'rmon (Tranquil Grove - Rooms 1 to 7):** Boshlang'ich qadimiy chorbog', Oqsoqol Alim, Ziyoratgoh, Baland qoyalar va 1-Boss: **Qadimgi Daraxt Qo'riqchisi (Ancient Treant)** -> mukofot: **Double Jump**.
2. **Ildiz G'orlari (Root Caverns - Rooms 8 to 14):** Chuqur yerosti ildizlari, O'tchi Leyla, Tikanli jarlik (Dash talab qiladi), Echo Rival 1 va 2-Boss: **Ildizlar Maxluqi (Root Behemoth)** -> mukofot: **Dash**.
3. **Unutilgan Ma'bad (Forgotten Sanctuary - Rooms 15 to 20):** Qadimiy minoralar, Rohib Toriq, Arxivlar (Yulduz rudasi), tik devorlar va 3-Boss: **Avtomat Posbon (Arch-Automaton Sentinel)** -> mukofot: **Wall Climb**.
4. **Qorong'i Yurak (Heart of Darkness - Rooms 21 to 27):** Spektral Altar (Maxsus Hujum Q), Temirchi Go'ran, yoriqli tosh to'siqlar, Maxfiy Poklash Yodgorligi va Final Boss: **Qoraygan Yurak Hukmdori (Corrupted Sovereign)** -> 3 fazali jang va yakuniy tanlov!
5. **Bonus Mashg'ulot Ziyoratgohi:** Qilich Ustasi Kamol va 1v1 Jangchi Bot portali.

---

## 6. Dushmanlar (8 tur) va Bosslar (4 Boss)

- **Melee Walker (Patrulchi):** Yaqinlashganda qilich bilan hujum qiladi.
- **Flyer (Uchar Qush):** Havoda suzadi va sho'ng'ib hujum qiladi.
- **Ranged Spitter (Otuvchi):** Masofadan zaharli sharlar otadi.
- **Charger (Hujumkor):** Telegraph chaqnashi bilan katta tezlikda yuguradi.
- **Shielded (Qalqonli):** Old zarbalarni to'sadi; orqadan yoki Maxsus Q hujumi bilan yengiladi.
- **Ambusher (Pistirmachi):** Yer ostiga yashirinib, yaqinlashganda sakrab chiqadi.
- **Area Hazard / Spawner (Zaharli In):** Zaharli to'lqinlar chiqaradi.
- **Elite Bruiser (Qora Bahodir):** Ko'p fazali og'ir zarbalar zanjiri va super-armorga ega.

Har bir boss aniq **Telegraph (0.4–0.8s ogohlantirish)** va zarbadan keyingi kafolatlangan **Damage Window (1.5x zarba oynasi)** mexanikasiga ega!

---

## 7. Questlar, Lore va 2 ta Yakun

- **10 ta Quest:** 5 ta Asosiy topshiriq (O'rmon chaqirig'i, Ildizlar zulmati, Ma'bad sirlari, Yurak sari yo'l, Muvozanatni tiklash) va 5 ta Qo'shimcha topshiriq (Yo'qolgan o'tlar, Askar nishoni, O'rmon jo'jasi, Xarobalar yozuvi, Qadimiy temirchi).
- **4 ta Qadimiy Solnoma:** Dunyo bo'ylab sochilmagan tarix parchalari.
- **2 ta Yakun:**
  - **1-Yakun (Asosiy):** Final bossni yo'q qilish orqali ochiladi.
  - **2-Yakun (Haqiqiy / Yashirin):** To'rtta solnomani yig'ish, Poklash Yodgorligini topish va yakuniy dialogda qalbni davolash tanlovini qilish orqali ochiladi.

---

## 8. Ishga tushirish va Build qo‘llanmasi

### Talablar
- Node.js (v18+)
- npm

### O'rnatish va ishlab chiqish rejimida ishga tushirish
```bash
npm install
npm run dev
```

### Ishlab chiqarish (Production Build)
```bash
npm run build
npm run preview
```
Build natijasi `dist/` papkasida to'liq statik veb-sayt sifatida hosil bo'ladi. Vercel, Netlify yoki GitHub Pages ga to'g'ridan-to'g'ri yuklanadi.

---

## 9. Vercel Deployment
Loyiha ildizida `vercel.json` sozlangan. Loyihani Vercel orqali bir buyruq bilan deploy qilish mumkin:
```bash
vercel --prod
```
yoki GitHub repozitoriyni Vercel dashboardiga bog'lash orqali avtomatik CI/CD deploy qilinadi.
