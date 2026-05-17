'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Member = { id: string; name: string; email: string }
type AttendanceRecord = { user_id: string; status: string }

const STATUS = {
  present: { label: '출석', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' },
  late:    { label: '지각', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30' },
  absent:  { label: '결석', class: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30' },
}

export default function AttendanceManageTab({ members }: { members: Member[] }) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [records, setRecords] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const shiftDay = (d: number) => {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + d)
    setDate(nd.toISOString().slice(0, 10))
  }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('attendance')
        .select('user_id, status')
        .eq('date', date)
      const map: Record<string, string> = {}
      data?.forEach((r: AttendanceRecord) => { map[r.user_id] = r.status })
      setRecords(map)
    }
    load()
  }, [date])

  const setStatus = async (userId: string, status: string) => {
    setSaving(userId)
    await supabase.from('attendance').upsert(
      { user_id: userId, date, status },
      { onConflict: 'user_id,date' }
    )
    setRecords(prev => ({ ...prev, [userId]: status }))
    setSaving(null)
  }

  const stats = {
    present: Object.values(records).filter(s => s === 'present').length,
    late: Object.values(records).filter(s => s === 'late').length,
    absent: Object.values(records).filter(s => s === 'absent').length,
    unchecked: members.length - Object.keys(records).length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">출결 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">날짜를 선택하고 각 회원의 출결을 체크하세요</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => shiftDay(-1)} className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-400">
            <ChevronLeft size={16} />
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
          <button onClick={() => shiftDay(1)} disabled={date >= today} className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-400 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
          {date === today && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">오늘</span>}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '출석', value: stats.present, color: 'text-emerald-400' },
          { label: '지각', value: stats.late, color: 'text-yellow-400' },
          { label: '결석', value: stats.absent, color: 'text-red-400' },
          { label: '미체크', value: stats.unchecked, color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 회원 목록 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">이름</th>
              <th className="px-5 py-3 text-center text-xs text-gray-500 font-medium">출석</th>
              <th className="px-5 py-3 text-center text-xs text-gray-500 font-medium">지각</th>
              <th className="px-5 py-3 text-center text-xs text-gray-500 font-medium">결석</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-600 text-sm">등록된 회원이 없습니다</td></tr>
            ) : (
              members.map(member => {
                const current = records[member.id]
                return (
                  <tr key={member.id} className="border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-400">
                          {member.name?.[0] || '?'}
                        </div>
                        <span className="text-sm font-medium text-white">{member.name}</span>
                        {saving === member.id && <span className="text-xs text-gray-600">저장중...</span>}
                      </div>
                    </td>
                    {(['present', 'late', 'absent'] as const).map(status => (
                      <td key={status} className="px-5 py-3 text-center">
                        <button
                          onClick={() => setStatus(member.id, current === status ? '' : status)}
                          className={`w-16 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            current === status
                              ? STATUS[status].class + ' ring-1 ring-offset-1 ring-offset-gray-900'
                              : 'bg-gray-800 text-gray-600 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {STATUS[status].label}
                        </button>
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
