'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, BookOpen, Users, Star } from 'lucide-react'

export default function GoalsTab({ profile }: { profile: any }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    monthly_goal: profile.monthly_goal || '',
    yearly_goal: profile.yearly_goal || '',
    want_to_learn: profile.want_to_learn || '',
    want_to_meet: profile.want_to_meet || '',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const upd = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const FIELDS = [
    {
      key: 'monthly_goal',
      icon: Target,
      title: '이달의 목표',
      placeholder: '예: 블로그 20개 발행, 인스타 팔로워 100명 늘리기',
      color: 'text-blue-400',
    },
    {
      key: 'yearly_goal',
      icon: Star,
      title: '올해의 목표',
      placeholder: '예: 월 매출 100만원 달성, 스마트스토어 오픈',
      color: 'text-yellow-400',
    },
    {
      key: 'want_to_learn',
      icon: BookOpen,
      title: '배우고 싶은 것',
      placeholder: '예: 영상 편집, 카피라이팅, 페이스북 광고 세팅',
      color: 'text-emerald-400',
    },
    {
      key: 'want_to_meet',
      icon: Users,
      title: '만나고 싶은 사람 / 회사',
      placeholder: '예: 투자자, 마케팅 전문가, 법무사, 비슷한 업종 창업자',
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">목표 & 희망사항</h2>
        <p className="text-sm text-gray-500 mt-0.5">관리자가 맞춤 지원을 위해 참고합니다</p>
      </div>

      <div className="space-y-4">
        {FIELDS.map(({ key, icon: Icon, title, placeholder, color }) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${color}`}>
              <Icon size={15} />
              {title}
            </label>
            <textarea
              value={form[key as keyof typeof form]}
              onChange={e => upd(key)(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}>
        {saved ? '✓ 저장됐습니다!' : saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
