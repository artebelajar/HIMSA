# HIMSA Implementation Guide

## Quick Start (Development Mode)

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation & Running

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm dev

# 3. Open http://localhost:3000
```

### Demo Credentials

| Email | Password | Role | Divisions |
|-------|----------|------|-----------|
| admin@himsa.com | admin123 | Admin | - |
| mukti@himsa.com | mukti123 | User | Dakwah, Bahasa |
| budi@himsa.com | budi123 | User | Keamanan |
| siti@himsa.com | siti123 | User | Kesejahteraan |
| user@himsa.com | user123 | User | None |

## Feature Testing Guide

### 1. Testing Multi-Division Users

**Scenario**: User with multiple divisions switching between them

```steps
1. Login: mukti@himsa.com / mukti123
2. Navigate to Settings
3. Click "Role Management" tab
4. See buttons: "Dakwah" and "Bahasa"
5. Click "Dakwah" → Current division is Dakwah
   - Can edit Hafalan Mingguan in Dashboard
   - Can switch to user mode
6. Click "Bahasa" → Current division is Bahasa
   - Can't edit Hafalan (not Dakwah)
   - Can still edit other content
7. Click "User Mode" button
   - currentDivision becomes undefined
   - Limited to user-level permissions
```

### 2. Testing Agenda Visibility

**Scenario**: Different users see different agendas based on visibility

```steps
A. As Admin (admin@himsa.com):
   1. Dashboard → Schedule page
   2. Click any date on calendar
   3. Create agenda: "Admin Meeting" (public)
   4. Save → Toast: "Agenda berhasil ditambahkan"

B. As Division User (mukti@himsa.com):
   1. Same date → See "Admin Meeting" (public agenda)
   2. Create own agenda: "Dakwah Session" (can be public or private)
   3. See both agendas in calendar

C. As Regular User (user@himsa.com):
   1. Same date → Can NOT see "Admin Meeting"
   2. Can see their own agendas only
   3. Create agenda: "My Task" (always private)
   4. Switch user mode → Becomes private (if was division user)
```

### 3. Testing Time-Based Reminders

**Scenario**: Create agenda with specific time and reminder

```steps
1. Schedule → Calendar → Click date
2. "Tambah Agenda" modal opens
3. Fill:
   - Judul: "Team Meeting"
   - Jam: 14 (hours selector)
   - Menit: 30 (minutes selector)
   - Pengingat: Toggle ON
   - Reminder time: "30 menit sebelumnya" (13:30)
   - Privat: OFF (for testing visibility)
4. Click "Simpan"
5. Toast: "Agenda berhasil ditambahkan"
6. Calendar shows agenda on that date
```

### 4. Testing Permissions

**Security Schedule (Keamanan)**
- Login: budi@himsa.com (Keamanan division)
  - ✓ Can edit security shifts
  - ✗ Can't edit welfare schedule
  - ✗ Can't edit hafalan

- Login: siti@himsa.com (Kesejahteraan division)
  - ✗ Can't edit security shifts
  - ✓ Can edit welfare schedule
  - ✗ Can't edit hafalan

- Login: mukti@himsa.com (Dakwah division)
  - ✗ Can't edit security shifts
  - ✗ Can't edit welfare schedule
  - ✓ Can edit hafalan mingguan

**Admin (admin@himsa.com)**
- ✓ Can do everything
- Can switch to any division mode
- Can test division-specific features

### 5. Testing Section Loading

**Scenario**: Section-level loading appears during operations

```steps
1. Go to any page with content
2. Perform action that triggers loading:
   - Click Edit button
   - Save form
   - Switch sections
3. Observe:
   - Dark overlay appears on right side only
   - Loading animation (rotating rings)
   - Loads for ~500ms (simulated API call)
   - Then disappears
```

### 6. Testing Scrollbar Styling

**Scenario**: Custom gradient scrollbar matches theme

```steps
1. On any page with scrollable content
2. Scroll to show scrollbar
3. Observe:
   - Scrollbar has gradient colors (cyan → purple)
   - Matches application theme
   - Smooth hover effect
   - Works in all browsers
```

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────┐
│          User Input (UI)                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    App Provider (Context State)         │
│  - User (with divisions)                │
│  - Permission checks                    │
│  - Role switching logic                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       localStorage (Demo Mode)          │
│  - User data                            │
│  - Agendas                              │
│  - Schedules                            │
│  - Posts                                │
└─────────────────────────────────────────┘
```

### Permission System

```typescript
// In app-provider.tsx:

canEditSchedules = user?.role === 'admin' || 
  ['Keamanan', 'Kesejahteraan'].includes(user?.currentDivision || '')

canEditHafalan = user?.role === 'admin' || 
  user?.currentDivision === 'Dakwah'

// Usage in components:
{canEditHafalan && <EditButton />}
```

### Visibility Logic

```typescript
// Get visible agendas based on user:

if (user.role === 'admin') {
  // Admin sees all agendas
  return allAgendas
} else if (user.currentDivision) {
  // Division user sees public + their own
  return allAgendas.filter(a => 
    a.visibility === 'public' || 
    a.createdBy === user.id
  )
} else {
  // Regular user sees only their own
  return allAgendas.filter(a => 
    a.createdBy === user.id
  )
}
```

## Simulated Database

### Data Storage Structure

```javascript
// localStorage keys:
'himsa_user'                  // Current user object
'himsa_agendas'               // All agenda items
'himsa_security_schedule'     // Security shifts
'himsa_welfare_schedule'      // Welfare cooking
'himsa_articles'              // Posted articles
'himsa_quotes'                // Posted quotes
'himsa_posters'               // Posted posters
'himsa_kas_payments'          // Kas tracking
'himsa_hafalan'               // Hafalan mingguan
'himsa_chat_messages'         // Chat history
```

### Simulated API Delays

All "API calls" have 500ms delay simulation:
```typescript
await new Promise((resolve) => 
  setTimeout(resolve, 500)
)
```

## Common Issues & Solutions

### Issue: Dependencies not installing
```bash
# Solution:
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Dev server won't start
```bash
# Check port 3000
lsof -i :3000

# Kill if needed
kill -9 <PID>

# Then:
pnpm dev
```

### Issue: Data not persisting between sessions
- Check browser cookie settings
- Clear cache and reload
- Check browser console for errors

### Issue: Permissions not working
- Verify user has division assigned
- Check if currentDivision is set
- Console.log(user) to debug

### Issue: Agenda not showing
- Verify visibility settings
- Check created user matches current user (for private)
- Check date is in correct format (YYYY-MM-DD)

## Production Migration Checklist

### Before Going Live
- [ ] Setup Supabase project
- [ ] Copy database schema from BACKEND_SETUP.md
- [ ] Implement API routes in app/api/
- [ ] Update .env.local with Supabase credentials
- [ ] Test all features with real database
- [ ] Setup error tracking (Sentry)
- [ ] Configure backup procedures
- [ ] Setup monitoring & alerts
- [ ] Create user documentation
- [ ] Train admin users

### Deployment
- [ ] Build: `pnpm build`
- [ ] Test build: `pnpm start`
- [ ] Deploy to Vercel
- [ ] Run database migrations
- [ ] Verify all features work
- [ ] Monitor error logs
- [ ] Rollback plan ready

## Key Files to Understand

| File | Purpose |
|------|---------|
| `providers/app-provider.tsx` | Main state management & logic |
| `components/agenda-modal.tsx` | Time picker & agenda creation |
| `app/schedule/page.tsx` | Calendar & schedules |
| `app/dashboard/page.tsx` | Main dashboard |
| `lib/supabase.ts` | Supabase client (prepared) |

## Next Steps

1. **Understand the Flow**
   - Read README.md for overview
   - Review app-provider.tsx for state logic
   - Check component structure

2. **Test All Features**
   - Use demo credentials above
   - Follow testing scenarios
   - Note any issues

3. **Customize for Production**
   - Update user data model if needed
   - Adjust permission logic
   - Configure database schema

4. **Deploy**
   - Follow DEPLOYMENT.md
   - Monitor after launch
   - Have rollback ready

---

For detailed technical info, see BACKEND_SETUP.md and DEPLOYMENT.md
