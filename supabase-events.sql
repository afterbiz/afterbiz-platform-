-- 이벤트 테이블 추가
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'attending' CHECK (status IN ('attending','cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_read" ON events FOR SELECT USING (true);
CREATE POLICY "events_write" ON events USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','admin_kihyun','admin_youngeun'))
);
CREATE POLICY "attendees_read" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "attendees_insert" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attendees_update" ON event_attendees FOR UPDATE USING (auth.uid() = user_id);
