'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Eye, CheckCircle, Calendar } from 'lucide-react'

type Profile = { business_status: string | null }

export default function GrowthTab({ userId, profile }: { userId: string; profile: Profile }) {
  const supabase = createClient()
  const [dailyData, setDailyData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [checklistStats, setChecklistStats] = useState({ done: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const isFounder = profile.business_status === 'active_revenue' || profile.business_status === 'active_no_revenue'

  useEffect(() => {
    const load = async () => {
      // 최근 30일 콘텐츠 데이터
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const fromDate = thirtyDaysAgo.toISOString().slice(0, 10)

      const [{ data: daily }, { data: attendance }, { data: checklist }] = await Promise.all([
        supabase.from('daily_checks').select('date, views, engagement').eq('user_id', userId).gte('date', fromDate).order('date'),
        supabase.from('attendance').select('date, status').eq('user_id', userId).gte('date', fromDate).order('date'),
        supabase.from('checklist_progress').select('admin_checked').eq('user_id', userId),
      ])

      setDailyData(daily?.map(d => ({ date: d.date.slice(5), views: d.views || 0, engagement: d.engagement || 0 })) || [])
      setAttendanceData(attendance?.map(a => ({
        date: a.date.slice(5),
        value: a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0,
        status: a.status,
      })) || [])
      setChecklistStats({
        done: checklist?.filter(c => c.admin_checked).length || 0,
        total: checklist?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [userId])

  const totalViews = dailyData.reduce((s, d) => s + d.views, 0)
  const totalEngagement = dailyData.reduce((s, d) => s + d.engagement, 0)
  const contentCount = dailyData.filter(d => d.views > 0).length
  const attendanceRate = attendanceData.length > 0
    ? Math.round((attendanceData.reduce((s, a) => s + a.value, 0) / attendanceData.length) * 100)
    : 0

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">성장 현황</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {isFounder ? '창업자' : '예비 창업자'} 기준 · 최근 30일
        </p>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Eye, label: '총 조회수', value: totalViews.toLocaleString(), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-900/40' },
          { icon: TrendingUp, label: '총 반응(좋아요+댓글)', value: totalEngagement.toLocaleString(), color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-900/40' },
          { icon: Calendar, label: '출결률', value: `${attendanceRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-900/40' },
          { icon: CheckCircle, label: '체크리스트', value: `${checklistStats.done}/${checklistStats.total}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-900/40' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`border rounded-2xl p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* 조회수 추이 */}
      {dailyData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-4">📈 조회수 추이</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="조회수" />
              <Line type="monotone" dataKey="engagement" stroke="#a855f7" strokeWidth={2} dot={false} name="반응" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 출결 현황 */}
      {attendanceData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-300 mb-4">📅 출결 현황</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={attendanceData} barSize={8}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: any, n: any, p: any) => [p.payload.status === 'present' ? '출석' : p.payload.status === 'late' ? '지각' : '결석', '']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {attendanceData.map((a, i) => (
                  <Cell key={i} fill={a.status === 'present' ? '#10b981' : a.status === 'late' ? '#facc15' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {[['#10b981', '출석'], ['#facc15', '지각'], ['#ef4444', '결석']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />{l}
              </div>
            ))}
          </div>
        </div>
      )}

      {dailyData.length === 0 && attendanceData.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-600 text-sm">
          아직 데이터가 없습니다.<br />
          데일리 체크를 시작하면 그래프가 나타납니다.
        </div>
      )}
    </div>
  )
}
