-- HIMSA Web App Database Schema for Supabase
-- Copy this entire SQL into Supabase SQL Editor and execute

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  divisions TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of divisions
  current_division VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Security Schedules
CREATE TABLE IF NOT EXISTS public.security_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_number INTEGER NOT NULL,
  members TEXT[] NOT NULL,
  schedule_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(schedule_date, group_number)
);

-- 3. Welfare Schedules
CREATE TABLE IF NOT EXISTS public.welfare_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL, -- '04:00', '10:00', '16:00'
  assigned_person VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(schedule_date, time_slot)
);

-- 4. Posts (Articles, Quotes, Posters)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'article', 'quote', 'poster'
  title VARCHAR(255),
  content TEXT,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES public.users(id),
  author_name VARCHAR(255) NOT NULL,
  author_division VARCHAR(100),
  likes_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Agendas
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  agenda_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'division', 'private'
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_by_role VARCHAR(50),
  created_by_division VARCHAR(100),
  reminder_time VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Kas (Payment Tracking)
CREATE TABLE IF NOT EXISTS public.kas_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  user_name VARCHAR(255) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  paid_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, month, year)
);

-- 7. Hafalan Mingguan
CREATE TABLE IF NOT EXISTS public.hafalan_mingguan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  language VARCHAR(50) DEFAULT 'arabic', -- 'arabic', 'english'
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_by_division VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(week_number, year)
);

-- 8. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  token VARCHAR(1000) NOT NULL UNIQUE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes untuk performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_security_schedules_date ON public.security_schedules(schedule_date);
CREATE INDEX idx_welfare_schedules_date ON public.welfare_schedules(schedule_date);
CREATE INDEX idx_agendas_date ON public.agendas(agenda_date);
CREATE INDEX idx_kas_payments_user_id ON public.kas_payments(user_id);
CREATE INDEX idx_hafalan_week ON public.hafalan_mingguan(week_number, year);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hafalan_mingguan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Posts (Everyone can view, only author can edit/delete)
CREATE POLICY "Everyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for Schedules (Only Keamanan/Kesejahteraan divisions can edit)
CREATE POLICY "Everyone can view schedules" ON public.security_schedules
  FOR SELECT USING (true);

CREATE POLICY "Keamanan can edit security schedules" ON public.security_schedules
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE 'Keamanan' = ANY(divisions) OR role = 'admin'
    )
  );

-- RLS Policies for Agendas (Visibility based on type)
CREATE POLICY "Users can view public agendas" ON public.agendas
  FOR SELECT USING (
    visibility = 'public' OR 
    auth.uid() IN (SELECT id FROM public.users WHERE created_at IS NOT NULL)
  );

CREATE POLICY "Users can create agendas" ON public.agendas
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for Kas (Only Wakil/Admin can edit)
CREATE POLICY "Everyone can view kas" ON public.kas_payments
  FOR SELECT USING (true);

CREATE POLICY "Wakil can update kas" ON public.kas_payments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE 'Wakil' = ANY(divisions) OR role = 'admin'
    )
  );

-- Insert default admin user (password: admin123)
INSERT INTO public.users (email, password_hash, name, role, divisions)
VALUES (
  'admin@himsa.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMymBjHxH0q.jVWAYWPYGFaQN2MkQqjGvAy', -- bcrypt hash
  'Admin HIMSA',
  'admin',
  ARRAY[]::TEXT[]
) ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO public.users (email, password_hash, name, role, divisions)
VALUES 
  ('mukti@himsa.com', '$2a$10$N9qo8uLOickgx2ZMRZoMymBjHxH0q.jVWAYWPYGFaQN2MkQqjGvAy', 'Mukti', 'user', ARRAY['Dakwah', 'Bahasa']),
  ('budi@himsa.com', '$2a$10$N9qo8uLOickgx2ZMRZoMymBjHxH0q.jVWAYWPYGFaQN2MkQqjGvAy', 'Budi', 'user', ARRAY['Keamanan']),
  ('siti@himsa.com', '$2a$10$N9qo8uLOickgx2ZMRZoMymBjHxH0q.jVWAYWPYGFaQN2MkQqjGvAy', 'Siti', 'user', ARRAY['Kesejahteraan']),
  ('user@himsa.com', '$2a$10$N9qo8uLOickgx2ZMRZoMymBjHxH0q.jVWAYWPYGFaQN2MkQqjGvAy', 'User Biasa', 'user', ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;
