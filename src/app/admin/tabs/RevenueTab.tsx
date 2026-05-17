'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react'

type Revenue = {
  id: string; type: string; company_name: string; amount: number
  description: string; date: string; member_id: string
  profiles?: { name: string }
}
type Member = { id: string; name: string }

export default function RevenueTab({ members, adminId }: { members: Member[]; adminId: string }) {
  const supabase = createClient()
  const [records, setRecords] = useState<Revenue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'direct', company_name: '', member_id: '', amount: '', description: '',
    date: new Date().toISOString().slice(0, 10)
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from('revenue_records')
      .select('*, profiles(name)')
      .order('date', { ascending: false })
    setRecords(data || [])
  }

  const handleSave = async () => {
    if (!form.amount) return
    setSaving(true)
    await supabase.from('revenue_records').insert({
      type: form.type, company_name: form.company_name.trim(),
      member_id: form.member_id || null, amount: Number(form.amount),
      description: form.description.trim(), date: form.date, created_by: adminId
    })
    setForm({ type: 'direct', company_name: '', member_id: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await supabase.from('revenue_records').delete().eq('id', id)
    load()
  }

  const stats = {
    direct: records.filter(r => r.type === 'direct').reduce((s, r) => s + r.amount, 0),
    indirect: records.filter(r => r.type === 'indirect').reduce((s, r) => s + r.amount, 0),
    total: records.reduce((s, r) => s + r.amount, 0),
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">매출 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">직접매출(내부) + 간접매출(회원사) 관리</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          <Plus size={14} /> 매출 추가
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '직접 매출 (퇴근후창업)', value: stats.direct, color: 'text-blue-400' },
          { label: '간접 매출 (회원사)', value: stats.indirect, color: 'text-emerald-400' },
          { label: '총 매출', value: stats.total, color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>
              {value >= 10000 ? `${(value / 10000).toFixed(0)}만` : value.toLocaleString()}원
            </p>
          </div>
        ))}
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="bg-gray-900 border border-blue-900/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">매출 등록</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">유형</label>
              <div className="flex gap-2">
                {[['direct', '직접매출'], ['indirect', '간접매출']].map(([v, l]) => (
                  <button key={v} onClick={() => setForm(p => ({ ...p, type: v }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${form.type === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">날짜</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">회사명 / 출처</label>
              <input placeholder="예: 퇴근후창업 수강료, ABC 회사" value={form.company_name}
                onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">금액 (원)</label>
              <input type="number" placeholder="0" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">관련 회원 (선택)</label>
              <select value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
                <option value="">선택 안 함</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">메모</label>
              <input placeholder="메모..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg">취소</button>
            <button onClick={handleSave} disabled={saving || !form.amount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {records.length === 0 ? (
          <div className="p-10 text-center text-gray-600 text-sm">아직 매출 기록이 없습니다</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs text-gray-500 font-medium">날짜</th>
                <th className="px-5 py-3 text-xs text-gray-500 font-medium">유형</th>
                <th className="px-5 py-3 text-xs text-gray-500 font-medium">출처</th>
                <th className="px-5 py-3 text-xs text-gray-500 font-medium">금액</th>
                <th className="px-5 py-3 text-xs text-gray-500 font-medium">회원</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-800/60 hover:bg-gray-800/20">
                  <td className="px-5 py-3 text-sm text-gray-400">{r.date}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${r.type === 'direct' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                      {r.type === 'direct' ? '직접' : '간접'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-200">{r.company_name || '-'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-white">{r.amount.toLocaleString()}원</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{(r.profiles as any)?.name || '-'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-500/20 text-gray-700 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
