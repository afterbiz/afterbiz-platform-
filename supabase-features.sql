-- =============================================
-- 신규 기능 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 데일리 체크에 기분/난이도 추가
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- 2. 프로필에 목표/희망 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS yearly_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS want_to_learn TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS want_to_meet TEXT;

-- 3. 커피챗 슬롯 (김기현 스케줄)
CREATE TABLE IF NOT EXISTS schedule_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  title TEXT DEFAULT '커피챗',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 커피챗 예약
CREATE TABLE IF NOT EXISTS coffee_chat_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES schedule_slots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_id)
);

-- 5. 그룹
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 6. 데일리 과제 반응 (좋아요/댓글)
CREATE TABLE IF NOT EXISTS daily_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'like' CHECK (type IN ('like','comment')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_user_id, target_date, user_id, type)
);

-- 7. 매출 관리
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct','indirect')),
  company_name TEXT,
  member_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_chat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

-- 스케줄: 모두 읽기, 관리자만 작성
CREATE POLICY "slots_read" ON schedule_slots FOR SELECT USING (true);
CREATE POLICY "slots_write" ON schedule_slots USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);

-- 예약: 본인 + 관리자
CREATE POLICY "bookings_all" ON coffee_chat_bookings USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);
CREATE POLICY "bookings_insert" ON coffee_chat_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 그룹: 모두 읽기, 관리자만 생성/삭제
CREATE POLICY "groups_read" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_write" ON groups USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);
CREATE POLICY "group_members_all" ON group_members USING (true);

-- 반응: 로그인 사용자만
CREATE POLICY "reactions_all" ON daily_reactions USING (auth.uid() IS NOT NULL);
CREATE POLICY "reactions_insert" ON daily_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 매출: 관리자만
CREATE POLICY "revenue_admin" ON revenue_records USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);
