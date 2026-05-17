'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABELS: Record<string, string> = {
  active_revenue: '사업 중 (매출 있음)',
  active_no_revenue: '사업 중 (매출 없음)',
  preparing: '예비 창업자',
  validating: '아이템 검증 중',
  exploring: '탐색 중',
}

export default function BusinessTab({ profile }: { profile: any }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    business_item: profile.business_item || '',
    business_description: profile.business_description || '',
    want_help_from: profile.want_help_from || '',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">내 사업 정리</h2>
        <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-full mt-1 inline-block">
          {STATUS_LABELS[profile.business_status] || '회원'}
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">사업 아이템 / 아이디어</label>
          <textarea value={form.business_item} onChange={(e) => setForm((p) => ({ ...p, business_item: e.target.value }))}
            placeholder="예: 핸드메이드 소품 스마트스토어" rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">사업 상세 설명</label>
          <textarea value={form.business_description} onChange={(e) => setForm((p) => ({ ...p, business_description: e.target.value }))}
            placeholder="현재 하고 있는 일, 목표 고객, 차별점 등을 자유롭게 작성해주세요" rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">어떤 회사/기관의 도움을 받고 싶으신가요?</label>
          <textarea value={form.want_help_from} onChange={(e) => setForm((p) => ({ ...p, want_help_from: e.target.value }))}
            placeholder="예: 투자사 연결, 법무 지원, 마케팅 협업..." rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}>
        {saved ? '✓ 저장됐습니다!' : saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
