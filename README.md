
# HIMSA - Himpunan Santri Almahir Web App

**Version:** 6.2 (Near Production-Ready)  
**Status:** Demo Mode with LocalStorage (Ready for Supabase Migration)

## Deskripsi Proyek

HIMSA (Himpunan Santri Almahir) adalah aplikasi web komprehensif untuk mengelola organisasi santri dengan fitur-fitur lengkap meliputi:
- Manajemen jadwal keamanan dan kesejahteraan
- Sistem posting artikel, quotes, dan poster
- Kalender interaktif dengan agenda
- Chat real-time
- Sistem hafalan mingguan
- Tracking pembayaran kas
- Manajemen divisi dan role-based access control

## Tech Stack

### Frontend
- **Framework:** Next.js 16.2.0
- **Runtime:** React 19
- **Styling:** Tailwind CSS 4.2.0
- **UI Components:** shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Form Management:** React Hook Form + Zod
- **Data Fetching:** SWR
- **Notifications:** Sonner

### Backend (Prepared for Production)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes
- **Security:** bcryptjs for password hashing, JWT tokens
- **ORM:** Ready for Supabase client integration

## Project Structure

```
himsa-web-app/
├── app/
│   ├── api/                    # API routes (prepared for production)
│   │   ├── README.md           # API documentation
│   │   ├── auth/               # Authentication endpoints
│   │   └── data/               # Data endpoints
│   ├── dashboard/              # Dashboard page
│   ├── schedule/               # Schedule page (Calendar + Shifts)
│   ├── upload/                 # Upload content page
│   ├── chat/                   # Chat page
│   ├── about/                  # About/Organization page
│   ├── settings/               # Settings page
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home/redirect page
│   └── globals.css             # Global styles + custom scrollbar
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── sidebar.tsx             # Floating sidebar navigation
│   ├── main-layout.tsx         # Layout wrapper
│   ├── page-transition.tsx     # Page loading animation
│   ├── hafalan-section.tsx     # Hafalan mingguan section
│   ├── kas-section.tsx         # Kas payment tracking
│   ├── article-detail-modal.tsx # Article detail view
│   ├── pagination.tsx          # Pagination component
│   └── cursor-trail.tsx        # Cursor animation
├── providers/
│   └── app-provider.tsx        # Context provider + auth logic
├── lib/
│   ├── utils.ts               # Utility functions
│   ├── supabase.ts            # Supabase client setup (prepared)
│   └── constants.ts           # Application constants
├── public/
│   └── [assets]               # Images and static files
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
└── next.config.mjs            # Next.js configuration

```

## Features Overview

### 1. Authentication System

**User Roles:**
- **Admin:** Single admin user with full system access
- **User:** Regular users with no divisions assigned
- **User with Division:** Users with one or more divisions

**User Model:**
```typescript
{
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  divisions: string[]        // Can have multiple divisions
  currentDivision?: string   // Currently active division (for demo/testing)
  avatar: string
}
```

**Demo Credentials:**
- Admin: admin@himsa.com / admin123
- Mukti (Dakwah & Bahasa): mukti@himsa.com / mukti123
- Budi (Keamanan): budi@himsa.com / budi123
- Siti (Kesejahteraan): siti@himsa.com / siti123
- User: user@himsa.com / user123

### 2. Dashboard

Menampilkan:
- Hafalan Mingguan Section (editable by Dakwah division)
- Status Pembayaran Kas (editable by Wakil division - simulated)
- Tabs untuk Articles, Quotes, Posters (10 items per page dengan pagination)
- Pagination controls untuk browsing content

### 3. Schedule Page

#### Calendar View
- Full month calendar (Sunday-Saturday format)
- Navigate prev/next bulan
- Highlight hari ini
- Add agenda per tanggal dengan time picker
- Agenda items berbeda untuk Admin/Division vs User

#### Security Shifts (Keamanan)
- Table dengan 7 kelompok keamanan
- Setiap kelompok = 3 orang
- Rotasi otomatis kecuali Jumat & Minggu
- Edit button hanya untuk Division Keamanan + Admin
- Reminder jam 11:15

#### Welfare Cooking Schedule (Kesejahteraan)
- 21 orang untuk 21 hari dengan 3 waktu (04:00, 10:00, 16:00 WIB)
- Garis pemisah hanya di antara hari berbeda
- Waktu dalam font modern dan besar
- Status tracking untuk masak nasi

### 4. Upload Page

**Features:**
- Tab untuk upload Article, Quote, Poster
- Form validation dengan Zod
- My Posts section dengan Edit/Delete buttons
- Pagination untuk posts (10 items per page)
- Inline editing tanpa reload halaman

**Permissions:**
- Division users bisa upload konten divisi mereka
- Admin bisa upload apapun
- Regular users hanya bisa chat

### 5. Chat Page

- Real-time message display (30 most recent)
- Load More button untuk pesan lama
- Mock typing indicators
- Message history dengan localStorage

### 6. About Page

- Visi & Misi
- Organization structure berdasarkan divisions
- Gradient cards dengan hover effects

### 7. Settings Page

**Tabs:**
- Profile: Edit user information
- Role Management: Switch between divisions (untuk users dengan multiple divisions)
- Admin Panel: Manage users dan divisions (admin only)
- Logout & Delete Account

**Features:**
- Division switching dengan `switchDivision()`
- User mode switching dengan `switchToUserMode()`
- Demo role switching untuk testing

## Agenda System

### Agenda Visibility Logic

**Admin & Division Users membuat agenda:**
- Default visibility: `public` - semua orang bisa lihat
- Bisa switch ke `private` untuk hanya diri sendiri
- Saat switch ke user mode, agenda menjadi private

**User yang membuat agenda:**
- Hanya bisa buat `private` agenda
- Hanya bisa lihat agenda mereka sendiri

**Viewing Agendas:**
```typescript
// Untuk User biasa
const visibleAgendas = allAgendas.filter(a => a.createdBy === currentUserId)

// Untuk Division User
const visibleAgendas = allAgendas.filter(a => 
  a.visibility === 'public' || 
  a.createdBy === currentUserId ||
  (a.visibility === 'division' && a.createdByDivision === currentDivision)
)

// Untuk Admin
const visibleAgendas = allAgendas // Semua bisa dilihat
```

### Time-Based Reminders

Setiap agenda item bisa memiliki:
- Specific date dan time
- Reminder notification pada waktu yang ditentukan
- Toast notification dengan agenda details

## Data Persistence

### Current Implementation (Demo)
- localStorage untuk semua data
- Auto-sync on changes
- Persists across browser sessions
- No page reload diperlukan untuk updates

### Production Implementation (Prepared)
Menggunakan Supabase dengan struktur:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP
)

-- User divisions table
CREATE TABLE user_divisions (
  id UUID PRIMARY KEY,
  user_id UUID,
  division VARCHAR(50),
  created_at TIMESTAMP
)

-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  image_url TEXT,
  author_id UUID,
  division VARCHAR(50),
  likes_count INTEGER,
  created_at TIMESTAMP
)

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  content TEXT,
  division VARCHAR(50),
  author_id UUID,
  likes_count INTEGER,
  created_at TIMESTAMP
)

-- Posters table
CREATE TABLE posters (
  id UUID PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  author_id UUID,
  division VARCHAR(50),
  aspect_ratio VARCHAR(10),
  created_at TIMESTAMP
)

-- Agendas table
CREATE TABLE agendas (
  id UUID PRIMARY KEY,
  title TEXT,
  date DATE,
  time TIME,
  created_by UUID,
  created_by_role VARCHAR(20),
  created_by_division VARCHAR(50),
  visibility VARCHAR(20),
  is_private BOOLEAN,
  reminder_time TIME,
  created_at TIMESTAMP
)

-- Security schedules table
CREATE TABLE security_schedules (
  id UUID PRIMARY KEY,
  date DATE,
  group_number INTEGER,
  members UUID[],
  created_at TIMESTAMP
)

-- Welfare schedules table
CREATE TABLE welfare_schedules (
  id UUID PRIMARY KEY,
  date DATE,
  time VARCHAR(5),
  person_id UUID,
  status VARCHAR(20),
  created_at TIMESTAMP
)

-- Kas payments table
CREATE TABLE kas_payments (
  id UUID PRIMARY KEY,
  user_id UUID,
  status BOOLEAN,
  amount INTEGER,
  paid_date TIMESTAMP,
  created_at TIMESTAMP
)

-- Hafalan table
CREATE TABLE hafalans (
  id UUID PRIMARY KEY,
  content TEXT,
  language VARCHAR(20),
  week INTEGER,
  year INTEGER,
  created_by UUID,
  created_at TIMESTAMP
)
```

RLS Policies sudah disiapkan untuk semua tabel (lihat BACKEND_SETUP.md).

## UI/UX Features

### Design System
- **Color Palette:** Luxury gradient (Cyan #00d9ff → Purple #a855f7)
- **Typography:** Space Grotesk (headings), Poppins (body)
- **Components:** shadcn/ui dengan custom styling
- **Animations:** Smooth transitions, gradient shifts, particle effects
- **Scrollbar:** Custom gradient scrollbar sesuai tema

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts dengan Tailwind CSS grid dan flexbox

### Performance Optimizations
- Pagination untuk mengurangi DOM elements
- Lazy loading untuk images
- Code splitting dengan Next.js dynamic imports
- Optimized animations dengan CSS transforms
- Efficient state management dengan React Context

### Loading States
- Section-level loading (hanya area content yang di-update)
- Page transition animation dengan dark overlay
- Smooth skeleton screens

## Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) atau npm

### Installation

```bash
# Clone repository
git clone <repo-url>
cd himsa-web-app

# Install dependencies
pnpm install

# Create .env.local dari .env.example
cp .env.example .env.local
# (Untuk production: isi dengan Supabase credentials)

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Project Commands

```bash
# Development
pnpm dev              # Start dev server

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
```

## Testing Demo Features

### 1. Multi-Division Users
```
Login: mukti@himsa.com / mukti123
- Mukti memiliki divisions: Dakwah, Bahasa
- Settings → Role Management: Switch antar division
- Setiap division punya permissions berbeda
```

### 2. Agenda Visibility
```
Login sebagai Admin → Create agenda (public visibility)
Logout → Login sebagai User biasa
- User hanya bisa lihat agenda mereka sendiri
```

### 3. Schedule Management
```
Login: budi@himsa.com / budi123 (Keamanan)
- Bisa edit jadwal keamanan
- Tidak bisa edit jadwal kesejahteraan

Login: siti@himsa.com / siti123 (Kesejahteraan)
- Bisa edit jadwal kesejahteraan
- Tidak bisa edit jadwal keamanan
```

### 4. Hafalan Mingguan
```
Login: mukti@himsa.com / mukti123 (Dakwah)
- Bisa edit hafalan mingguan di dashboard
- Admin juga bisa edit
```

## Production Deployment

Untuk implementasi production, ikuti:

1. **Setup Supabase:**
   - Buat account di supabase.com
   - Create new project
   - Copy API credentials

2. **Configure Environment:**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

3. **Database Migration:**
   - Jalankan SQL schema dari BACKEND_SETUP.md
   - Setup RLS policies
   - Create seed data

4. **API Implementation:**
   - Implement endpoints di app/api/
   - Gunakan Supabase client dari lib/supabase.ts
   - Follow error handling patterns

5. **Deploy:**
   - Connect GitHub repository
   - Deploy ke Vercel (recommended)
   - Setup CI/CD pipelines

Lihat DEPLOYMENT.md untuk detail lengkap.

## Troubleshooting

### Masalah: Dependencies tidak terinstall
```bash
# Clear cache dan reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Masalah: Dev server tidak berjalan
```bash
# Pastikan port 3000 tidak terpakai
lsof -i :3000
# Kill process jika perlu
```

### Masalah: localStorage data tidak persisten
- Clear browser cache
- Pastikan cookies tidak di-block
- Check browser console untuk errors

## Contributing

Untuk kontribusi:
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## PRODUCTION MIGRATION GUIDE

**Current Status:** Demo dengan LocalStorage - BELUM Production Ready

### Apa yang Sudah Siap:
- ✅ Frontend UI 100% complete
- ✅ Semua fitur berfungsi dengan demo data
- ✅ Component structure production-ready
- ✅ Env variables template tersedia
- ✅ Supabase client setup (lib/supabase.ts)
- ✅ Role-based access control implemented
- ✅ Admin user management panel

### Yang Belum Selesai (Todo untuk Production):

1. **Database Migration**
   - [ ] Copy DATABASE_SCHEMA.sql ke Supabase SQL Editor
   - [ ] Run semua migration queries
   - [ ] Verifikasi tables dan RLS policies

2. **API Routes Implementation**
   - [ ] Implement `/api/auth/register` - Create user di Supabase
   - [ ] Implement `/api/auth/login` - Authenticate & return JWT
   - [ ] Implement `/api/users/*` - User management endpoints
   - [ ] Implement `/api/schedules/*` - Security & Welfare schedules
   - [ ] Implement `/api/posts/*` - Articles, Quotes, Posters
   - [ ] Implement `/api/agenda/*` - Calendar agendas
   - [ ] Implement `/api/kas/*` - Payment tracking
   - [ ] Implement `/api/hafalan/*` - Hafalan mingguan

3. **Frontend Integration**
   - [ ] Remove all localStorage references
   - [ ] Update AppProvider untuk pakai Supabase Auth
   - [ ] Add SWR hooks untuk data fetching dari API
   - [ ] Add error handling & loading states
   - [ ] Test semua flows end-to-end

4. **Authentication**
   - [ ] Setup Supabase Auth dengan email/password
   - [ ] Implement JWT token management
   - [ ] Add session persistence
   - [ ] Setup protected routes
   - [ ] Add logout & session timeout

5. **Security**
   - [ ] Implement RLS (Row Level Security) di Supabase
   - [ ] Validate JWT di API routes
   - [ ] Setup CORS properly
   - [ ] Input validation & sanitization
   - [ ] Rate limiting

6. **Testing & Deployment**
   - [ ] Unit tests untuk API routes
   - [ ] Integration tests untuk critical flows
   - [ ] Load testing
   - [ ] Deploy ke Vercel
   - [ ] Setup monitoring & logging

---

## PANDUAN IMPLEMENTASI SUPABASE (BAHASA INDONESIA)

### STEP 1: Membuat Akun Supabase & Project

**A. Buka Supabase:**
1. Buka website https://supabase.com
2. Klik "Sign Up" atau "Start Your Project"
3. Pilih login dengan GitHub (paling mudah) atau email
4. Verifikasi email Anda

**B. Buat Project Baru:**
1. Setelah login, klik "New Project" atau "Create a new project"
2. Pilih nama project: `himsa-app` (atau nama lainnya)
3. Pilih region: `Southeast Asia (Singapore)` atau region terdekat
4. Buat password database (catat baik-baik!)
5. Klik "Create new project"
6. Tunggu proses selesai (±2-3 menit)

---

### STEP 2: Mengambil API Keys

Setelah project dibuat, Anda akan melihat dashboard Supabase:

**A. Cari Settings:**
1. Di sidebar kiri, klik "Settings" (paling bawah)
2. Di submenu, pilih "API"
3. Anda akan melihat:
   - **Project URL** - ini adalah `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys** - ada 2 key:
     - **`anon` (public)** - ini adalah `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **`service_role`** - ini adalah `SUPABASE_SERVICE_ROLE_KEY`

**B. Copy Keys:**
```
NEXT_PUBLIC_SUPABASE_URL = [Project URL - copy dari sini]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon key - copy dari sini]
SUPABASE_SERVICE_ROLE_KEY = [service_role key - copy dari sini]
```

**Contoh:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### STEP 3: Setup Environment Variables

**A. Buat file `.env.local` di root project:**
```bash
# Di folder himsa-app, buat file bernama .env.local
# Atau copy dari .env.example
cp .env.example .env.local
```

**B. Edit `.env.local` dan isi dengan data Supabase:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste anon key dari Supabase]
SUPABASE_SERVICE_ROLE_KEY=[paste service role key dari Supabase]
```

**PENTING:** Jangan share `.env.local` di GitHub! File ini sudah di `.gitignore`

---

### STEP 4: Membuat Database Tables

Sekarang kita perlu membuat tables di Supabase:

**A. Buka SQL Editor di Supabase:**
1. Di sidebar kiri, klik "SQL Editor"
2. Klik tombol "+ New Query" atau "New SQL Query"

**B. Copy-paste DATABASE_SCHEMA.sql:**
1. Buka file `DATABASE_SCHEMA.sql` di project
2. Copy SELURUH isinya
3. Paste ke SQL Editor di Supabase
4. Klik "Run" atau "Execute" (tombol play biru)
5. Tunggu hingga selesai (lihat output "Success")

**C. Verifikasi Tables:**
1. Di sidebar kiri, buka "Table Editor"
2. Verifikasi tables sudah ada:
   - users
   - user_divisions
   - security_schedules
   - welfare_schedules
   - posts
   - agendas
   - kas_payments
   - hafalan

---

### STEP 5: Setup Authentication di Supabase

**A. Enable Email Authentication:**
1. Di sidebar, klik "Authentication"
2. Pilih tab "Providers"
3. Pastikan "Email" sudah enabled (biasanya default)
4. Konfigurasi email settings jika perlu

**B. Set Email Template (Optional):**
1. Di "Authentication", pilih tab "Templates"
2. Edit template jika ingin customize

---

### STEP 6: Setup di Local Development

**A. Install Dependencies:**
```bash
npm install
```

**B. Jalankan Development Server:**
```bash
npm run dev
```

**C. Test di Browser:**
```
http://localhost:3000
```

---

### STEP 7: Testing Login Flow

**A. Register User Baru:**
1. Buka http://localhost:3000
2. Klik "Buat Akun"
3. Isi email dan password
4. Klik "Daftar"
5. Cek apakah user berhasil dibuat

**B. Check di Supabase:**
1. Buka Supabase dashboard
2. Klik "Authentication" → "Users"
3. Cek apakah user baru muncul di list

**C. Login:**
1. Klik "Kembali ke Login" atau refresh halaman
2. Login dengan email dan password yang baru
3. Cek apakah berhasil masuk ke dashboard

---

### STEP 8: Implementasi API Routes

Sekarang perlu buat API routes untuk handle:

**Yang Sudah Siap di Frontend:**
- Login form di `/auth/login`
- Register form di `/auth/register`
- Dashboard di `/dashboard`
- Schedule page di `/schedule`

**Yang Perlu Di-implementasi (Backend):**

1. **`/api/auth/register`** - Daftar user baru
2. **`/api/auth/login`** - Login user
3. **`/api/auth/logout`** - Logout
4. **`/api/users`** - Manage users
5. **`/api/schedules`** - Manage schedule
6. **`/api/posts`** - Manage posts
7. **`/api/agendas`** - Manage agendas
8. **`/api/kas`** - Manage kas

**Referensi:** Lihat file `/app/api/README.md` untuk guidelines

---

### STEP 9: Connect Frontend ke Supabase

Update `providers/app-provider.tsx` untuk:
1. Ganti localStorage dengan Supabase Auth
2. Fetch data dari API routes
3. Handle error dan loading states

---

### TROUBLESHOOTING

**Q: "NEXT_PUBLIC_SUPABASE_URL not found"**
A: Pastikan `.env.local` sudah dibuat dan berisi konfigurasi Supabase

**Q: "Error connecting to database"**
A: 
1. Cek apakah URL Supabase benar
2. Cek apakah ANON_KEY benar
3. Cek koneksi internet
4. Restart dev server: `npm run dev`

**Q: "Authentication failed"**
A:
1. Pastikan Email provider sudah enabled di Supabase
2. Cek apakah user sudah terdaftar di `Authentication → Users`
3. Cek console browser untuk error messages

**Q: "Tables not found"**
A:
1. Pastikan DATABASE_SCHEMA.sql sudah dijalankan
2. Buka SQL Editor dan klik "Run" lagi
3. Check apakah ada error message di output

---

### CHECKLIST SETUP SUPABASE

- [ ] Membuat akun Supabase
- [ ] Membuat project baru
- [ ] Copy NEXT_PUBLIC_SUPABASE_URL
- [ ] Copy NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Copy SUPABASE_SERVICE_ROLE_KEY
- [ ] Membuat file `.env.local`
- [ ] Paste semua keys ke `.env.local`
- [ ] Buka SQL Editor di Supabase
- [ ] Copy-paste DATABASE_SCHEMA.sql
- [ ] Run SQL query (klik Execute)
- [ ] Verifikasi tables di Table Editor
- [ ] Enable Email Authentication
- [ ] Test register user baru
- [ ] Test login
- [ ] Implementasi API routes
- [ ] Test end-to-end flow

---

### NEXT STEPS SETELAH SETUP SUPABASE

1. **Implementasi API routes** (lihat `/app/api/README.md`)
2. **Update AppProvider** untuk Supabase Auth
3. **Replace localStorage** dengan API calls
4. **Testing** end-to-end
5. **Deploy** ke Vercel
6. **Monitor** aplikasi di production

---

### Quick Start untuk Production:

1. **Setup Supabase:**
   - Buat project di https://supabase.com
   - Copy URL dan ANON KEY ke `.env.local`
   - Go to SQL Editor dan paste `DATABASE_SCHEMA.sql`
   - Run query dan tunggu selesai

2. **Setup Environment:**
   ```bash
   cp .env.example .env.local
   # Isi dengan Supabase credentials
   ```

3. **Install & Run:**
   ```bash
   npm install
   npm run dev
   ```

4. **Implementasi API Routes:**
   - Check `/app/api/README.md` untuk guidelines
   - Implement routes satu per satu
   - Test dengan Postman/Insomnia

---

## PANDUAN IMPLEMENTASI API ROUTES

### Overview API Routes yang Diperlukan

**Auth Routes:**
- `POST /api/auth/register` - Daftar user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session

**User Routes:**
- `GET /api/users/[id]` - Get user detail
- `PUT /api/users/[id]` - Update user profile
- `PUT /api/users/[id]/divisions` - Assign divisions to user
- `GET /api/users/list` - Get all users (admin only)

**Schedule Routes:**
- `GET /api/schedules/security` - Get security schedules
- `POST /api/schedules/security` - Create/update security schedule (Keamanan + Admin)
- `GET /api/schedules/welfare` - Get welfare schedules
- `POST /api/schedules/welfare` - Create/update welfare schedule (Kesejahteraan + Admin)

**Post Routes:**
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get post detail
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

**Agenda Routes:**
- `GET /api/agendas` - Get agendas
- `POST /api/agendas` - Create agenda
- `DELETE /api/agendas/[id]` - Delete agenda

**Kas Routes:**
- `GET /api/kas` - Get kas list
- `PUT /api/kas/[id]` - Update payment status (Wakil + Admin)

**Hafalan Routes:**
- `GET /api/hafalan` - Get hafalan mingguan
- `POST /api/hafalan` - Update hafalan (Dakwah + Admin)

---

### Template API Route (Next.js)

Semua routes menggunakan pattern yang sama:

```typescript
// app/api/[folder]/[endpoint].ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get data from Supabase
    const { data, error } = await supabase
      .from('table_name')
      .select('*')

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert data to Supabase
    const { data, error } = await supabase
      .from('table_name')
      .insert([body])

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
```

---

### Contoh Implementation: Auth Routes

**File: `app/api/auth/register.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan name harus diisi' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          role: 'user',
          created_at: new Date(),
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(
      { 
        message: 'User berhasil dibuat',
        user: data[0]
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
```

**File: `app/api/auth/login.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Get user divisions
    const { data: divisions } = await supabase
      .from('user_divisions')
      .select('division')
      .eq('user_id', user.id)

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    return NextResponse.json(
      {
        message: 'Login berhasil',
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
```

---

### Frontend Integration dengan SWR

Setelah API routes siap, update frontend untuk menggunakannya:

**Update `providers/app-provider.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token dari localStorage
    const saved = localStorage.getItem('himsa_token')
    if (saved) setToken(saved)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error)
    }

    const { token, user } = await res.json()
    setToken(token)
    localStorage.setItem('himsa_token', token)
    localStorage.setItem('himsa_user', JSON.stringify(user))
    return user
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error)
    }

    const { user } = await res.json()
    return user
  }

  return (
    <AppContext.Provider value={{ token, login, register, ... }}>
      {children}
    </AppContext.Provider>
  )
}
```

---

### Testing API Routes dengan Postman

1. **Download Postman** dari https://www.postman.com/downloads/
2. **Buat Request Baru:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Klik "Send"
3. **Test Login:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```

---

### Deployment ke Vercel

Setelah API routes siap:

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Implement Supabase API routes"
   git push origin main
   ```

2. **Deploy ke Vercel:**
   - Buka https://vercel.com
   - Connect repository GitHub
   - Add environment variables (sama seperti `.env.local`)
   - Klik "Deploy"

---

### Summary

Berikut adalah urutan implementasi yang disarankan:

1. ✅ Setup Supabase & database (sudah dijelaskan di atas)
2. ✅ Setup `.env.local` dengan Supabase credentials
3. Implement API routes: Auth → Users → Schedules → Posts → Agendas → Kas
4. Update frontend untuk use API routes instead of localStorage
5. Testing end-to-end
6. Deploy ke production

### Database Schema File:
Lihat `DATABASE_SCHEMA.sql` untuk complete schema dengan:
- 8 Tables: users, roles, schedules, posts, agendas, kas, hafalan, sessions
- RLS Policies untuk security
- Indexes untuk performance
- Foreign keys untuk data integrity

### Estimated Timeline:
- Database setup: 30 min
- API routes: 4-6 hours
- Frontend integration: 2-3 hours
- Testing & debugging: 2-3 hours
- Total: ~1-2 days untuk production-ready

## License

[Your License Here]

## Contact & Support

- Email: support@himsa.org
- GitHub Issues: [Repository Issues]
- Documentation: See BACKEND_SETUP.md, DEPLOYMENT.md, IMPLEMENTATION_GUIDE.md

---

### COMPLETED IN V6.2:

**UI/UX:**
- ✅ Calendar boxes now properly square (aspect-square)
- ✅ Agenda details shown in calendar (count + preview)
- ✅ Section margins properly configured (p-6 padding)
- ✅ Sidebar visibility fixed (left-4 top-4 positioning)
- ✅ Beautiful modern gradient theme
- ✅ Smooth page transitions dengan loading overlay
- ✅ Multi-division user system implemented

**Backend Prepared:**
- ✅ Complete DATABASE_SCHEMA.sql dengan 8 tables
- ✅ RLS policies for security
- ✅ Supabase client setup (lib/supabase.ts)
- ✅ .env.example dengan semua required vars
- ✅ API routes structure documented

**Features Fully Implemented:**
- ✅ User authentication system
- ✅ Role-based access control (Admin, User dengan divisions)
- ✅ Admin can assign/remove divisions dari users
- ✅ Security schedule dengan 7 groups
- ✅ Welfare schedule dengan 3 time slots
- ✅ Calendar dengan agenda management
- ✅ Post management (Article, Quote, Poster)
- ✅ Kas payment tracking (Wakil + Admin only)
- ✅ Hafalan mingguan (Dakwah + Admin only)
- ✅ Real-time chat (mock)
- ✅ Settings dengan role management

### KNOWN LIMITATIONS (For Production):
- Uses LocalStorage untuk data (demo mode)
- API routes belum implemented
- Supabase belum connected
- No real-time capabilities (belum WebSocket)

**Last Updated:** April 2026  
**Maintained by:** HIMSA Development Team  
**Status:** Frontend 100% Complete - Ready for Backend Implementation  
**Next Phase:** Connect to Supabase + Implement API Routes
