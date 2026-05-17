'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, ExternalLink, Eye, Heart, ChevronLeft, ChevronRight } from 'lucide-react'

const MOODS = [
  { value: 'great', emoji: '😄', label: '최고' },
  { value: 'good', emoji: '😊', label: '좋음' },
  { value: 'neutral', emoji: '😐', label: '보통' },
  { value: 'bad', emoji: '😞', label: '힘듦' },
  { value: 'terrible', emoji: '😫', label: '최악' },
]

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 'normal', label: '보통', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { value: 'hard', label: '어려움', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
]

export default function DailyCheckTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [data, setData] = useState({
    content_link: '',
    views: '',
    engagement: '',
    tomorrow_plan: '',
    allow_marketing: false,
    mood: '',
    difficulty: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: row } = await supabase
        .from('daily_checks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (row) {
        setData({
          content_link: row.content_link || '',
          views: row.views?.toString() || '',
          engagement: row.engagement?.toString() || '',
          tomorrow_plan: row.tomorrow_plan || '',
          allow_marketing: row.allow_marketing || false,
          mood: row.mood || '',
          difficulty: row.difficulty || '',
        })
      } else {
        setData({ content_link: '', views: '', engagement: '', tomorrow_plan: '', allow_marketing: false, mood: '', difficulty: '' })
      }
    }
    load()
  }, [date, userId])

  const shiftDay = (d: number) => {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + d)
    const nk = nd.toISOString().slice(0, 10)
    if (nk <= today) setDate(nk)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('daily_checks').upsert({
      user_id: userId,
      date,
      content_link: data.content_link,
      views: Number(data.views) || 0,
      engagement: Number(data.engagement) || 0,
      tomorrow_plan: data.tomorrow_plan,
      allow_marketing: data.allow_marketing,
      mood: data.mood,
      difficulty: data.difficulty,
    }, { onConflict: 'user_id,date' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-bold text-white">데일리 콘텐츠 체크</h2>

      {/* 날짜 선택 */}
      <div className="flex items-center gap-2">
        <button onClick={() => shiftDay(-1)} className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-400 active:scale-95">
          <ChevronLeft size={18} />
        </button>
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 text-center" />
        <button onClick={() => shiftDay(1)} disabled={date >= today}
          className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-400 disabled:opacity-30 active:scale-95">
          <ChevronRight size={18} />
        </button>
        {date === today && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">오늘</span>}
      </div>

      {/* 콘텐츠 링크 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500 flex items-center gap-1 mb-2"><Link2 size={11} /> 오늘의 콘텐츠 링크</label>
          <div className="flex gap-2">
            <input type="url" placeholder="https://blog.naver.com/..." value={data.content_link}
              onChange={(e) => setData((p) => ({ ...p, content_link: e.target.value }))}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            {data.content_link && (
              <a href={data.content_link} target="_blank" rel="noreferrer"
                className="flex items-center px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl">
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        {/* 성과 지표 */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">📊 성과 지표</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 flex items-center gap-1 mb-1.5"><Eye size={11} /> 조회수</label>
              <input type="number" min="0" placeholder="0" value={data.views}
                onChange={(e) => setData((p) => ({ ...p, views: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-lg text-gray-200 text-center font-bold focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-600 flex items-center gap-1 mb-1.5"><Heart size={11} /> 좋아요+댓글</label>
              <input type="number" min="0" placeholder="0" value={data.engagement}
                onChange={(e) => setData((p) => ({ ...p, engagement: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-lg text-gray-200 text-center font-bold focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* 홍보 동의 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div onClick={() => setData((p) => ({ ...p, allow_marketing: !p.allow_marketing }))}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${data.allow_marketing ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}`}>
            {data.allow_marketing && <span className="text-white text-xs">✓</span>}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            이 콘텐츠를 홍보 자료로 활용해도 좋습니다
          </p>
        </label>
      </div>

      {/* 기분 + 난이도 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">오늘의 기분</p>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setData(p => ({ ...p, mood: p.mood === m.value ? '' : m.value }))}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${data.mood === m.value ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
                <span className="text-xl">{m.emoji}</span>
                <span className="text-xs text-gray-500">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">과제 난이도</p>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d.value} onClick={() => setData(p => ({ ...p, difficulty: p.difficulty === d.value ? '' : d.value }))}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${data.difficulty === d.value ? d.color + ' border-opacity-100' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 내일 계획 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <label className="text-xs text-gray-500 block mb-2">내일 만들 콘텐츠 계획</label>
        <textarea placeholder="내일은 어떤 콘텐츠를 만들 건가요?" value={data.tomorrow_plan}
          onChange={(e) => setData((p) => ({ ...p, tomorrow_plan: e.target.value }))}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}>
        {saved ? '✓ 저장됐습니다!' : saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
