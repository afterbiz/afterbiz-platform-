-- 체크리스트 테이블 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 수업 체크리스트 항목 (관리자가 만드는 기준)
CREATE TABLE checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '일반' CHECK (category IN ('콘텐츠', '마케팅', '사업', '네트워킹', '일반')),
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 회원별 체크리스트 진행 상황
CREATE TABLE checklist_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  admin_checked BOOLEAN DEFAULT false,
  admin_note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- RLS 설정
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

-- 체크리스트 항목: 모두 읽기 가능, 관리자만 작성
CREATE POLICY "checklist_items_read" ON checklist_items FOR SELECT USING (true);
CREATE POLICY "checklist_items_write" ON checklist_items USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);

-- 체크리스트 진행: 본인 + 관리자
CREATE POLICY "checklist_progress_all" ON checklist_progress USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);
