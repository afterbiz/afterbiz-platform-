'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_CONFIG = {
  present: { label: '출석', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  late:    { label: '지각', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  absent:  { label: '결석', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export default function AttendanceTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [userId])

  const stats = {
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
  }

  const rate = records.length > 0
    ? Math.round(((stats.present + stats.late * 0.5) / records.length) * 100)
    : 0

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-bold text-white">출결 현황</h2>

      {/* 요약 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '출석', value: stats.present, color: 'text-emerald-400' },
          { label: '지각', value: stats.late, color: 'text-yellow-400' },
          { label: '결석', value: stats.absent, color: 'text-red-400' },
          { label: '출석률', value: `${rate}%`, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 목록 */}
      {records.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-600 text-sm">
          아직 출결 기록이 없습니다
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-800/60">
            {records.map((r) => {
              const cfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG]
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-300">{r.date}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
