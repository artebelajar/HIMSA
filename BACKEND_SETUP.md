# HIMSA Backend Setup Guide

## Database Setup - Supabase

### 1. Create Supabase Project
- Go to https://supabase.com and create a new project
- Choose your region (closest to your users)
- Save your project URL and API keys

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Tables to Create

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Articles Table
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  division TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Quotes Table
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  division TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

#### Posters Table
```sql
CREATE TABLE posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

#### Chat Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

#### Security Schedule Table
```sql
CREATE TABLE security_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  group_number INTEGER NOT NULL,
  members TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Welfare Schedule Table
```sql
CREATE TABLE welfare_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Hafalan Weekly Table
```sql
CREATE TABLE hafalan_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  week_start DATE NOT NULL,
  language TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Kas Table
```sql
CREATE TABLE kas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 4. Enable Row Level Security (RLS)

For each table, enable RLS and create policies:
```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view articles" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own articles" ON articles
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own articles" ON articles
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own articles" ON articles
  FOR DELETE USING (auth.uid() = author_id);
```

## API Routes Structure (Next.js 14+)

### Auth Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Content Endpoints
- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create article (protected)
- `PUT /api/articles/[id]` - Update article (protected)
- `DELETE /api/articles/[id]` - Delete article (protected)

### Schedule Endpoints
- `GET /api/schedule/security` - Get security schedule
- `PUT /api/schedule/security` - Update security schedule (Keamanan + Admin)
- `GET /api/schedule/welfare` - Get welfare schedule
- `PUT /api/schedule/welfare` - Update welfare schedule (Kesejahteraan + Admin)

### Chat Endpoints
- `GET /api/messages` - Get messages (paginated)
- `POST /api/messages` - Send message (protected)

## Performance Optimization

### Caching Strategy
- Use Next.js built-in caching with `revalidateTag()`
- Cache user data with 5-minute TTL
- Cache schedule data with 1-hour TTL

### Database Indexes
```sql
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_security_schedule_date ON security_schedule(date);
CREATE INDEX idx_welfare_schedule_date ON welfare_schedule(date);
```

### API Response Optimization
- Pagination: 10-20 items per request
- Select only needed fields from database
- Use database-level filtering instead of app-level

## Libraries to Install

```bash
# Database & ORM
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs

# Data Validation
npm install zod
npm install @hookform/resolvers

# API Optimization
npm install swr
npm install react-query

# Date Handling
npm install date-fns

# Security
npm install bcryptjs
npm install jsonwebtoken
```

## Next Steps

1. Set up Supabase project and create tables
2. Update `.env.local` with your Supabase credentials
3. Create API routes in `/app/api/` directory
4. Implement Supabase client utilities
5. Migrate localStorage data to Supabase
6. Set up authentication with JWT tokens
7. Enable Row Level Security policies
8. Deploy to production

## Security Considerations

- Use HTTPS only
- Enable Supabase RLS for all tables
- Implement rate limiting on API endpoints
- Use environment variables for secrets
- Validate all user inputs on backend
- Implement CORS properly
- Use JWT tokens with short expiration
