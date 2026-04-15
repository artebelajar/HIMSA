# CARA JALANKAN APLIKASI KE DATABASE - LANGKAH DEMI LANGKAH

**Untuk mereka yang bukan programmer - SANGAT DETAIL DAN MUDAH DIIKUTI**

---

## PERSIAPAN AWAL (HANYA 1 KALI)

### LANGKAH 1: Buka Terminal

**Di Windows:**
1. Buka folder project (folder `himsa-app`)
2. Klik di address bar (tempat tulisan lokasi folder)
3. Ketik: `cmd`
4. Tekan Enter
5. Terminal akan terbuka

**Di Mac:**
1. Buka Finder → folder project
2. Klik `File` → `Open in Terminal`
3. Terminal akan terbuka

**Di Linux:**
1. Buka folder project
2. Klik kanan → `Open in Terminal`
3. Terminal akan terbuka

---

### LANGKAH 2: Install Package yang Dibutuhkan

Ketik di terminal:

```bash
npm install bcryptjs jsonwebtoken
```

Tunggu hingga selesai (lihat tulisan "added X packages" di akhir). Jangan tutup terminal.

---

### LANGKAH 3: Cek File `.env.local`

Pastikan file `.env.local` sudah ada di folder project dengan isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=your-secret-key-ganti
```

**Kalau belum ada, buat:**
1. Buka text editor (Notepad, VS Code, atau text editor lainnya)
2. Copy isi di atas
3. Edit dengan nilai Supabase Anda (dari step Supabase setup sebelumnya)
4. Simpan dengan nama `.env.local` di folder project utama

---

### LANGKAH 4: Restart Dev Server

Di terminal, tekan:
- **Ctrl + C** (untuk stop server yang sedang running)
- Tunggu sampai berhenti

Kemudian jalankan lagi:

```bash
npm run dev
```

Tunggu sampai muncul tulisan:
```
✓ Compiled successfully
ready - started server on 0.0.0.0:3000
```

---

## TESTING & PENGGUNAAN

### TEST 1: REGISTER USER BARU

1. **Buka browser:**
   - Buka http://localhost:3000
   - Kalau terganggu, buka http://localhost:3000/auth/login

2. **Klik "Buat Akun" atau "Register"**

3. **Isi form:**
   - Nama: `Budi Septian` (atau nama Anda)
   - Email: `budi@example.com` (EMAIL BARU, belum pernah terdaftar)
   - Password: `password123`

4. **Klik tombol "Daftar"**

5. **Harusnya:**
   - Muncul pesan "Pendaftaran berhasil!"
   - Redirect ke halaman login
   - **Lihat terminal**, seharusnya ada tulisan:
     ```
     [API Register] Request: { name: 'Budi Septian', email: 'budi@example.com' }
     [API Register] Success: xxxxx (ID user yang baru dibuat)
     ```

---

### TEST 2: CEK DI SUPABASE APAKAH USER MASUK DATABASE

1. **Buka browser tab baru:**
   - Buka https://supabase.com
   - Login dengan akun Anda

2. **Buka project:**
   - Klik project `himsa-app` (atau nama project Anda)

3. **Buka Table Editor:**
   - Di sidebar kiri, klik "Table Editor"
   - Atau klik "SQL Editor" kalau mau query manual

4. **Cek table `users`:**
   - Klik table `users`
   - Lihat list user
   - **HARUSNYA ADA:** `budi@example.com` dengan:
     - `name`: Budi Septian
     - `email`: budi@example.com
     - `role`: user
     - `created_at`: waktu sekarang

**JIKA BERHASIL = DATA SUDAH MASUK DATABASE! ✓**

---

### TEST 3: LOGIN DENGAN USER BARU

1. **Kembali ke browser localhost:**
   - Buka http://localhost:3000/auth/login

2. **Isi form login:**
   - Email: `budi@example.com`
   - Password: `password123`

3. **Klik "Login"**

4. **Harusnya:**
   - Muncul pesan "Login berhasil!"
   - Redirect ke dashboard
   - **Lihat terminal**, seharusnya ada tulisan:
     ```
     [API Login] Request: budi@example.com
     [API Login] Success: xxxxx (ID user)
     ```

5. **Lihat halaman dashboard:**
   - Harusnya muncul nama user di profile (kiri atas)
   - Seharusnya bisa akses semua halaman (jadwal, posting, dll)

---

## TROUBLESHOOTING (KALAU ADA MASALAH)

### MASALAH 1: "Error: Cannot find module 'bcryptjs'"

**Solusi:**
1. Buka terminal
2. Ketik: `npm install bcryptjs jsonwebtoken`
3. Tunggu selesai
4. Restart dev server: `npm run dev`

---

### MASALAH 2: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solusi:**
1. Cek apakah file `.env.local` ada di folder utama
2. Cek apakah isinya ada `NEXT_PUBLIC_SUPABASE_URL=https://...`
3. Kalau masih tidak ada, buat file baru:
   - Buka text editor
   - Paste isi dari `.env.example`
   - Ganti dengan nilai Supabase Anda
   - Simpan dengan nama `.env.local`
4. Restart dev server

---

### MASALAH 3: "Email sudah terdaftar!" tapi Anda baru pertama kali register

**Solusi:**
- Email yang Anda pakai sudah ada di database
- Cek di Supabase table `users`
- Gunakan email yang berbeda
- Contoh: `budi2@example.com` atau `budi@gmail.com`

---

### MASALAH 4: "Email atau password salah" saat login

**Kemungkinan:**
1. Email tidak cocok dengan yang didaftar
2. Password salah
3. User belum didaftar

**Solusi:**
1. Cek Supabase table `users` apakah user ada
2. Coba register ulang dengan email baru
3. Pastikan password yang diketik sama dengan saat register

---

### MASALAH 5: Data user tidak muncul di Supabase

**Kemungkinan:**
1. API route tidak jalan dengan benar
2. DATABASE_SCHEMA.sql belum di-run
3. Ada error di backend (cek terminal)

**Solusi:**
1. Lihat terminal, apakah ada error message?
2. Copy error message dan baca baik-baik
3. Cek apakah DATABASE_SCHEMA.sql sudah di-run di Supabase
4. Kalau masih tidak tahu, screenshot error dan tanya ke developer

---

### MASALAH 6: "Table 'users' doesn't exist"

**Solusi:**
1. Buka Supabase dashboard
2. Buka SQL Editor
3. Copy isi file `DATABASE_SCHEMA.sql`
4. Paste ke SQL Editor Supabase
5. Klik tombol "Run" atau "Execute"
6. Tunggu sampai sukses
7. Restart dev server: `npm run dev`

---

## FITUR YANG SUDAH BISA DIPAKAI

Setelah API routes diimplementasikan:

✅ **Register** - Daftar user baru ke database
✅ **Login** - Login dengan email dan password ke database
✅ **Logout** - Logout dari aplikasi
✅ **Profile** - Lihat profil user
✅ **Settings** - Ubah pengaturan (masih pakai localStorage, belum connect database)
✅ **Dashboard** - Lihat dashboard
✅ **Schedule** - Lihat jadwal (masih demo, belum connect database penuh)

---

## FITUR YANG MASIH BELUM CONNECT KE DATABASE

❌ **Posts** - Belum bisa upload artikel, quote, poster
❌ **Kas** - Belum bisa tracking pembayaran kas
❌ **Hafalan** - Belum bisa tracking hafalan
❌ **Agendas** - Belum bisa simpan agenda ke database
❌ **Schedules** - Belum bisa edit jadwal dan simpan ke database

**Ini akan diimplementasikan di fase berikutnya.**

---

## RINGKASAN FLOW YANG TERJADI

```
1. User buka http://localhost:3000
   ↓
2. User isi form register/login
   ↓
3. Frontend kirim data ke API route (/api/auth/register atau /api/auth/login)
   ↓
4. API route terima data
   ↓
5. API route connect ke Supabase
   ↓
6. API route simpan/check data di Supabase database
   ↓
7. API route kirim response balik ke frontend
   ↓
8. Frontend terima response
   ↓
9. Frontend simpan data dan redirect ke dashboard
   ↓
10. User berhasil login/register!
```

---

## KESIMPULAN

Sekarang Anda sudah bisa:
1. ✅ Register user baru → data masuk ke Supabase
2. ✅ Login dengan user baru → ambil data dari Supabase
3. ✅ Lihat data user di Supabase dashboard
4. ✅ Password sudah di-hash untuk keamanan

**API routes untuk fitur lain akan diimplementasikan di phase berikutnya!**
