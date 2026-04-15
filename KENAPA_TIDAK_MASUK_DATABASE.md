# KENAPA DATA USER TIDAK MASUK KE DATABASE?

## JAWABAN SINGKAT

Data user tidak masuk ke database karena **belum ada API route untuk mengirim data ke Supabase**. Sekarang aplikasi masih pakai localStorage (penyimpanan lokal di browser), bukan database Supabase.

---

## ANALOGI UNTUK MEMAHAMI

Bayangkan seperti ini:

1. **Situasi Sekarang (DEMO - tidak bisa simpan ke database):**
   - User isi form → Data hanya disimpan di browser (localStorage)
   - Kalau browser di-clear/close-buka ulang → data hilang
   - Tidak bisa lihat data di Supabase dashboard

2. **Situasi Yang Diinginkan (PRODUCTION - bisa simpan ke database):**
   - User isi form → Kirim data ke SERVER via API
   - SERVER terima data → Simpan ke Supabase database
   - Data permanent & bisa dilihat di Supabase dashboard
   - Data tetap ada walau browser ditutup/di-clear

---

## MASALAH TEKNIS YANG MUNCUL

### Masalah 1: Tidak Ada API Route
Sekarang di folder `/app/api/` kosong. Padahal perlu:
- `/api/auth/register` - untuk daftar user baru
- `/api/auth/login` - untuk login
- Dan route-route lainnya

### Masalah 2: App Provider Masih Pakai Dummy Data
File `providers/app-provider.tsx` masih pakai `DUMMY_USERS` (data hardcoded) dengan localStorage, belum connect ke Supabase.

### Masalah 3: Login Page Belum Connect ke Database
Form di `/app/auth/login` langsung hit `login()` function, tapi function itu masih pakai localStorage, bukan database.

---

## LANGKAH-LANGKAH UNTUK FIX (SANGAT DETAIL)

### LANGKAH 1: Buat Folder API Routes

Struktur folder yang perlu dibuat:

```
app/
  └─ api/
      └─ auth/
          ├─ register/
          │   └─ route.ts          <-- FILE BARU
          └─ login/
              └─ route.ts          <-- FILE BARU
```

**Cara membuat:**
- Jangan buat manual, akan saya buatkan otomatis di step berikutnya

---

### LANGKAH 2: Siapkan Supabase Database

**Sebelum lanjut, pastikan:**

1. ✅ Sudah buat account Supabase di https://supabase.com
2. ✅ Sudah buat project baru
3. ✅ Sudah copy NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
4. ✅ Sudah paste ke file `.env.local`
5. ✅ Sudah run DATABASE_SCHEMA.sql di Supabase SQL Editor

**Cara cek apakah sudah benar:**
- Buka https://supabase.com → Login
- Buka project Anda
- Klik "Table Editor" di sidebar kiri
- Pastikan ada table: `users`, `user_divisions`, `security_schedules`, dll
- Kalau tidak ada, berarti DATABASE_SCHEMA.sql belum di-run

---

### LANGKAH 3: Install Package yang Diperlukan

Buka terminal di folder project dan jalankan:

```bash
npm install bcryptjs jsonwebtoken
```

Ini untuk:
- `bcryptjs` - untuk hash password (tidak bisa disimpan plaintext)
- `jsonwebtoken` - untuk buat token login

---

### LANGKAH 4: Buat API Route Register

File: `/app/api/auth/register/route.ts`

Isi file dengan kode di bawah ini (saya akan jelaskan setiap bagian):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Fungsi ini dipanggil ketika user submit form register
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Ambil data dari form (nama, email, password)
    const { name, email, password } = await request.json()
    console.log('[API] Register request:', { name, email })

    // STEP 2: Validasi - pastikan semua field diisi
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nama, email, dan password harus diisi!' },
        { status: 400 }
      )
    }

    // STEP 3: Buat koneksi ke Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // STEP 4: Cek apakah email sudah terdaftar
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar!' },
        { status: 400 }
      )
    }

    // STEP 5: Hash password untuk keamanan
    // Hash = mengubah password jadi kode random yang tidak bisa di-decode
    const hashedPassword = await bcrypt.hash(password, 10)

    // STEP 6: Simpan user baru ke Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword, // Simpan yang sudah di-hash
          role: 'user', // Role default = user biasa
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[API] Error insert user:', error)
      throw error
    }

    console.log('[API] User created:', data[0]?.id)

    // STEP 7: Kirim respons sukses ke frontend
    return NextResponse.json(
      {
        message: 'Pendaftaran berhasil!',
        user: {
          id: data[0].id,
          name: data[0].name,
          email: data[0].email,
          role: data[0].role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Register error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
```

**PENJELASAN KODE:**

- **`import`** - Mengambil library yang dibutuhkan
- **`export async function POST`** - Fungsi yang handle request POST dari frontend
- **`request.json()`** - Ambil data JSON dari form (nama, email, password)
- **Validasi** - Pastikan semua field ada, kalau tidak kirim error
- **`createClient`** - Koneksi ke Supabase pakai credentials dari `.env.local`
- **`supabase.from('users').select()`** - Query table users untuk cek email
- **`bcrypt.hash()`** - Ubah password menjadi hash (password asli tidak disimpan)
- **`supabase.from('users').insert()`** - Simpan user baru ke database
- **Return** - Kirim respons sukses atau error ke frontend

---

### LANGKAH 5: Buat API Route Login

File: `/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Ambil email dan password dari form
    const { email, password } = await request.json()
    console.log('[API] Login request:', email)

    // STEP 2: Validasi
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi!' },
        { status: 400 }
      )
    }

    // STEP 3: Koneksi ke Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // STEP 4: Cari user di database berdasarkan email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('[API] User not found:', email)
      return NextResponse.json(
        { error: 'Email atau password salah!' },
        { status: 401 }
      )
    }

    // STEP 5: Cek apakah password benar
    // bcrypt.compare() = bandingkan password input dengan password di database
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('[API] Password invalid for:', email)
      return NextResponse.json(
        { error: 'Email atau password salah!' },
        { status: 401 }
      )
    }

    // STEP 6: Ambil divisions milik user (bisa punya lebih dari 1)
    const { data: divisions } = await supabase
      .from('user_divisions')
      .select('division')
      .eq('user_id', user.id)

    // STEP 7: Buat token JWT untuk session
    // Token ini = bukti bahwa user sudah login, dikirim di setiap request
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this', // Secret key untuk sign token
      { expiresIn: '7d' } // Token expire dalam 7 hari
    )

    console.log('[API] Login success:', user.id)

    // STEP 8: Kirim response sukses beserta token dan data user
    return NextResponse.json(
      {
        message: 'Login berhasil!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          divisions: divisions?.map(d => d.division) || [],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Login error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
```

---

### LANGKAH 6: Update App Provider untuk Pakai API

File: `providers/app-provider.tsx`

Ganti bagian `login` dan `register` function dengan yang ini:

```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true)
  try {
    console.log('[AppProvider] Logging in:', email)
    
    // KIRIM REQUEST KE API ROUTE
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login gagal')
    }

    console.log('[AppProvider] Login success:', data.user)

    // SIMPAN TOKEN DAN USER KE LOCALSTORAGE
    localStorage.setItem('himsa_token', data.token)
    localStorage.setItem('himsa_user', JSON.stringify(data.user))

    // UPDATE STATE
    const userData: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      divisions: data.user.divisions || [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.name}`,
    }
    
    setUser(userData)
  } catch (error) {
    console.error('[AppProvider] Login error:', error)
    throw error
  } finally {
    setIsLoading(false)
  }
}

const register = async (name: string, email: string, password: string) => {
  setIsLoading(true)
  try {
    console.log('[AppProvider] Registering:', email)
    
    // KIRIM REQUEST KE API ROUTE
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Register gagal')
    }

    console.log('[AppProvider] Register success:', data.user)

    // SIMPAN USER KE LOCALSTORAGE
    localStorage.setItem('himsa_user', JSON.stringify(data.user))

    // UPDATE STATE
    const userData: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      divisions: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.name}`,
    }
    
    setUser(userData)
  } catch (error) {
    console.error('[AppProvider] Register error:', error)
    throw error
  } finally {
    setIsLoading(false)
  }
}
```

---

## URUTAN IMPLEMENTASI YANG BENAR

1. ✅ Sudah setup Supabase & ambil credentials
2. ✅ Sudah buat `.env.local` dengan credentials
3. ✅ Sudah run DATABASE_SCHEMA.sql
4. ⏳ **Jalankan: `npm install bcryptjs jsonwebtoken`**
5. ⏳ **Buat file: `/app/api/auth/register/route.ts` dengan kode di atas**
6. ⏳ **Buat file: `/app/api/auth/login/route.ts` dengan kode di atas**
7. ⏳ **Update: `providers/app-provider.tsx` dengan kode baru**
8. ⏳ **Restart dev server: `npm run dev`**
9. ⏳ **Test: Buka http://localhost:3000/auth/register dan daftar user baru**
10. ⏳ **Verifikasi: Buka Supabase dashboard dan cek apakah user masuk di table `users`**

---

## CARA TEST APAKAH BERHASIL

### Test 1: Register User Baru

1. Buka http://localhost:3000/auth/register
2. Isi:
   - Nama: `Budi Septian`
   - Email: `budi@example.com`
   - Password: `password123`
3. Klik "Daftar"
4. Harusnya redirect ke login
5. **CEK DI SUPABASE:**
   - Buka https://supabase.com
   - Buka project Anda
   - Klik "Table Editor"
   - Klik table "users"
   - Lihat apakah user `budi@example.com` sudah ada

### Test 2: Login dengan User Baru

1. Buka http://localhost:3000/auth/login
2. Isi:
   - Email: `budi@example.com`
   - Password: `password123`
3. Klik "Login"
4. Harusnya masuk ke dashboard

### Test 3: Cek Browser Console

1. Buka aplikasi di browser
2. Tekan `F12` (buka developer tools)
3. Klik tab "Console"
4. Coba register atau login
5. Lihat pesan `[API]` yang saya log di kode
6. Ini membantu debug kalau ada error

---

## COMMON ERRORS & SOLUSINYA

### Error: "Cannot find module 'bcryptjs'"
**Solusi:** Jalankan `npm install bcryptjs jsonwebtoken`

### Error: "NEXT_PUBLIC_SUPABASE_URL not found"
**Solusi:** Cek `.env.local` apakah:
- File ada di root folder (sebelah `package.json`)
- Isinya ada `NEXT_PUBLIC_SUPABASE_URL=https://...`
- Isinya ada `SUPABASE_SERVICE_ROLE_KEY=eyJ...`

### Error: "User not found" saat login
**Solusi:** 
- Pastikan user sudah terdaftar (sudah run register)
- Cek di Supabase apakah email ada di table users

### Error di Console: "Tables doesn't exist"
**Solusi:**
- DATABASE_SCHEMA.sql belum di-run
- Buka Supabase SQL Editor
- Copy-paste DATABASE_SCHEMA.sql
- Klik "Run" atau "Execute"

---

## KESIMPULAN

Sekarang Anda sudah paham:
1. **Kenapa tidak masuk database:** Belum ada API route yang mengirim data ke Supabase
2. **Apa yang perlu ditambah:** API routes untuk register dan login
3. **Bagaimana cara implementasi:** Step-by-step yang detail
4. **Cara test:** Register user baru dan cek di Supabase dashboard

Semua kode sudah saya sediakan, tinggal copy-paste ke file yang benar dan restart dev server!
