-- =============================================
-- 퇴근후창업 플랫폼 데이터베이스 설정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('super_admin', 'admin_kihyun', 'admin_youngeun', 'member', 'guest')),

  -- 사업 정보
  business_status TEXT, -- active_revenue | active_no_revenue | preparing | validating | exploring
  business_item TEXT,
  business_description TEXT,
  want_help_from TEXT, -- 어떤 회사의 도움을 받고 싶은지

  -- 신청 정보
  source TEXT,
  needs TEXT[],
  motivation TEXT,
  content_type TEXT[],

  -- 상태
  is_active BOOLEAN DEFAULT true,
  generation TEXT, -- 1기 | 2기 | 3기
  membership_type TEXT DEFAULT 'free',
  monthly_fee INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 출결 테이블
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. 데일리 체크 테이블
CREATE TABLE daily_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content_link TEXT,
  views INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  tomorrow_plan TEXT,
  allow_marketing BOOLEAN DEFAULT false,
  is_success BOOLEAN DEFAULT false,
  success_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. 공지 / 블로그 게시글 테이블
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'notice' CHECK (category IN ('notice', 'blog', 'community')),
  is_public BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  -- SEO 필드
  meta_title TEXT,
  meta_description TEXT,
  slug TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 주간 점수 (신호등)
CREATE TABLE weekly_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL, -- 예: 2026-W18
  attendance BOOLEAN DEFAULT false,
  homework BOOLEAN DEFAULT false,
  contribution INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_key)
);

-- 6. 코칭 피드백 테이블
CREATE TABLE coaching_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  memo TEXT,
  next_task TEXT,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_key)
);

-- =============================================
-- RLS (Row Level Security) 설정
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_feedback ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 데이터 읽기/수정, 관리자는 전체
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- daily_checks: 본인 읽기/쓰기, 관리자 전체
CREATE POLICY "daily_checks_all" ON daily_checks USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);

-- attendance: 본인 읽기, 관리자 쓰기
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);
CREATE POLICY "attendance_all_admin" ON attendance USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);

-- posts: 공개글 전체 읽기, 작성은 관리자만
CREATE POLICY "posts_select_public" ON posts FOR SELECT USING (is_public = true OR auth.uid() IS NOT NULL);
CREATE POLICY "posts_write_admin" ON posts USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);

-- weekly_scores: 본인 + 관리자
CREATE POLICY "weekly_scores_all" ON weekly_scores USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);

-- coaching_feedback: 본인 읽기, 관리자 작성
CREATE POLICY "coaching_select" ON coaching_feedback FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);
CREATE POLICY "coaching_write_admin" ON coaching_feedback USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin_kihyun', 'admin_youngeun'))
);

-- =============================================
-- 회원가입 시 프로필 자동 생성 트리거
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 관리자 계정 역할 설정 (가입 후 실행)
-- 이메일 주소를 실제로 바꿔주세요
-- =============================================
-- UPDATE profiles SET role = 'super_admin' WHERE email = '전체관리자@email.com';
-- UPDATE profiles SET role = 'admin_kihyun' WHERE email = '김기현@email.com';
-- UPDATE profiles SET role = 'admin_youngeun' WHERE email = '이영은@email.com';
