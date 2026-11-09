# AR Inner Voice — prototipe web

Prototipe ini adalah **rule-based counseling assistant** berbasis CBT dengan visualisasi pikiran menggunakan marker-based WebAR.

## Isi folder
- `index.html` — struktur halaman.
- `style.css` — tampilan responsif.
- `app.js` — alur wizard, aturan IF–THEN, dan penyimpanan jurnal lokal.

## Cara menjalankan
1. Ekstrak folder.
2. Jalankan melalui server lokal, bukan membuka `index.html` langsung. Contoh:
   - VS Code: pasang ekstensi Live Server, lalu klik kanan `index.html` → Open with Live Server.
   - Python: dari folder ini jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`.
3. Untuk kamera AR di perangkat lain, hosting harus menggunakan HTTPS.
4. Berikan izin kamera pada browser.
5. Pada tahap rangkuman, tekan **Buka kamera AR**.
6. Arahkan kamera ke marker Hiro. Marker dapat dibuka/cetak dari:
   https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png

## Logika rule-based
Prototipe tidak memakai AI generatif. Alur interaksi ditentukan oleh tahapan tetap:
1. Check-in emosi
2. Eksplorasi situasi
3. Identifikasi pikiran otomatis
4. Evaluasi pikiran dan saran pola distorsi berbasis kata kunci
5. Penyusunan pikiran alternatif
6. Rangkuman refleksi

Contoh aturan:
- IF pikiran mengandung kata "selalu/tidak pernah/semua" THEN tampilkan saran overgeneralization.
- IF pikiran mengandung pola "saya bodoh/saya gagal" THEN tampilkan saran labeling.
- IF pikiran mengandung "hidup saya hancur/tidak ada masa depan" THEN tampilkan saran catastrophizing.

Aturan kata kunci ini hanya demonstrasi awal. Kalimat bahasa alami sangat kontekstual, sehingga saran pola pikir tidak boleh dianggap sebagai diagnosis atau penilaian otomatis yang pasti. Dalam penggunaan konseling, konselor perlu memvalidasi konteks dan makna bersama konseli.

## AR
WebAR menggunakan A-Frame dan AR.js melalui CDN, dengan marker Hiro. Objek virtual (bola transparan, cincin, dan teks pikiran) akan muncul di atas marker. Koneksi internet diperlukan untuk memuat pustaka CDN.

## Catatan privasi dan keselamatan
- Data jurnal disimpan pada `localStorage` browser perangkat yang digunakan, tidak dikirim ke server.
- Jangan gunakan perangkat bersama untuk menyimpan informasi konseling sensitif.
- Ini prototipe pendidikan, bukan alat diagnosis, terapi mandiri, atau layanan darurat.
- Konselor tetap bertanggung jawab atas asesmen, keputusan profesional, dan pendampingan konseli.
- Untuk implementasi nyata, tambahkan autentikasi, persetujuan, enkripsi, kebijakan retensi/penghapusan data, dan penilaian keamanan sebelum menyimpan data konseling.
