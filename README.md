
# HIMSA - Himpunan Santri Almahir Web App

**Version:** 6.0 (Production-Ready)  
**Status:** Demo Mode with Simulated Data

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

## License

[Your License Here]

## Contact & Support

- Email: support@himsa.org
- GitHub Issues: [Repository Issues]
- Documentation: See BACKEND_SETUP.md dan DEPLOYMENT.md

---

**Last Updated:** April 2026  
**Maintained by:** HIMSA Development Team
