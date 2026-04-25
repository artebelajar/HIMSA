-- HIMSA Web App Database Schema for Supabase
-- Copy this entire SQL into Supabase SQL Editor and execute

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'division')),
  divisions TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_division VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Security Schedules
CREATE TABLE IF NOT EXISTS public.security_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number INTEGER NOT NULL,
  members TEXT[] NOT NULL,
  schedule_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(schedule_date, group_number)
);

-- 3. Welfare Schedules
CREATE TABLE IF NOT EXISTS public.welfare_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL CHECK (time_slot IN ('04:00', '10:00', '16:00')),
  assigned_person VARCHAR(255) NOT NULL,
  assigned_person_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(schedule_date, time_slot)
);

-- 4. Posts Table (Unified for Articles, Quotes, Posters)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'quote', 'poster')),
  title VARCHAR(255),
  content TEXT,
  image_url TEXT,
  aspect_ratio VARCHAR(10) CHECK (aspect_ratio IN ('9:16', '16:9', '1:1')),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_division VARCHAR(100),
  division VARCHAR(100),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Post Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(post_id, user_id)
);

-- 6. Messages (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  attachment_url TEXT,
  attachment_type VARCHAR(20) CHECK (attachment_type IN ('image', 'document')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Agendas
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  agenda_date DATE NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'division', 'private')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by_role VARCHAR(50),
  created_by_division VARCHAR(100),
  reminder_time VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. Hafalan Mingguan
CREATE TABLE IF NOT EXISTS public.hafalan_mingguan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  language VARCHAR(50) DEFAULT 'arabic' CHECK (language IN ('arabic', 'english')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by_division VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(week_number, year)
);

-- 9. Kas Payments
CREATE TABLE IF NOT EXISTS public.kas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, month, year)
);

-- 10. Proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size VARCHAR(50),
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_division ON public.posts(division);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_shifts_date ON public.security_shifts(schedule_date);
CREATE INDEX IF NOT EXISTS idx_welfare_shifts_date ON public.welfare_shifts(schedule_date);
CREATE INDEX IF NOT EXISTS idx_agendas_date ON public.agendas(agenda_date);
CREATE INDEX IF NOT EXISTS idx_agendas_visibility ON public.agendas(visibility);
CREATE INDEX IF NOT EXISTS idx_hafalan_week ON public.hafalan_mingguan(week_number, year);
CREATE INDEX IF NOT EXISTS idx_kas_payments_user_id ON public.kas_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kas_payments_month_year ON public.kas_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_proposals_uploaded_by ON public.proposals(uploaded_by);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hafalan_mingguan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Everyone can view, only self can update
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Posts: Everyone can view, authenticated can create, author can update/delete
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Post Likes: Everyone can view, authenticated can create/delete own
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: Everyone can view, authenticated can create
CREATE POLICY "Messages are viewable by everyone" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Security Shifts: Everyone can view, admin/keamanan can edit
CREATE POLICY "Security shifts are viewable by everyone" ON public.security_shifts
  FOR SELECT USING (true);

CREATE POLICY "Admin and Keamanan can edit security shifts" ON public.security_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (
        role = 'admin' OR 'Keamanan' = ANY(divisions)
      )
    )
  );

-- Welfare Shifts: Everyone can view, admin/kesejahteraan can edit
CREATE POLICY "Welfare shifts are viewable by everyone" ON public.welfare_shifts
  FOR SELECT USING (true);

CREATE POLICY "Admin and Kesejahteraan can edit welfare shifts" ON public.welfare_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (
        role = 'admin' OR 'Kesejahteraan' = ANY(divisions)
      )
    )
  );

-- Agendas: View based on visibility
CREATE POLICY "Agendas viewable by visibility" ON public.agendas
  FOR SELECT USING (
    visibility = 'public' OR
    (visibility = 'division' AND created_by_division IN (
      SELECT unnest(divisions) FROM public.users WHERE id = auth.uid()
    )) OR
    (visibility = 'private' AND created_by = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Authenticated users can create agendas" ON public.agendas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own agendas" ON public.agendas
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own agendas" ON public.agendas
  FOR DELETE USING (created_by = auth.uid());

-- Hafalan: Everyone can view, admin/dakwah can edit
CREATE POLICY "Hafalan is viewable by everyone" ON public.hafalan_mingguan
  FOR SELECT USING (true);

CREATE POLICY "Admin and Dakwah can edit hafalan" ON public.hafalan_mingguan
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (
        role = 'admin' OR 'Dakwah' = ANY(divisions)
      )
    )
  );

-- Kas Payments: Everyone can view, admin/wakil can edit
CREATE POLICY "Kas payments are viewable by everyone" ON public.kas_payments
  FOR SELECT USING (true);

CREATE POLICY "Admin and Wakil can edit kas payments" ON public.kas_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (
        role = 'admin' OR 'Wakil' = ANY(divisions)
      )
    )
  );

-- Proposals: Everyone can view, authenticated can upload
CREATE POLICY "Proposals are viewable by everyone" ON public.proposals
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own proposals" ON public.proposals
  FOR DELETE USING (uploaded_by = auth.uid());

-- Functions

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_shifts_updated_at BEFORE UPDATE ON public.security_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welfare_shifts_updated_at BEFORE UPDATE ON public.welfare_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendas_updated_at BEFORE UPDATE ON public.agendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hafalan_updated_at BEFORE UPDATE ON public.hafalan_mingguan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kas_payments_updated_at BEFORE UPDATE ON public.kas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;