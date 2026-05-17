'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, CheckSquare, Coffee,
  DollarSign, LogOut, ChevronRight, Megaphone, UserCheck,
  Zap, TrendingUp, AlertCircle, Clock
} from 'lucide-react'
import AttendanceManageTab from './tabs/AttendanceManageTab'
import ChecklistManageTab from './tabs/ChecklistManageTab'
import RevenueTab from './tabs/RevenueTab'
import ScheduleManageTab from './tabs/ScheduleManageTab'
import BoardManageTab from './tabs/BoardManageTab'

const ROLE_LABEL: Record<string, string> = {
  super_admin: '전체 관리자', admin_kihyun: '김기현', admin_youngeun: '이영은', member: '회원',
}
const STATUS_LABEL: Record<string, string> = {
  active_revenue: '사업중(매출O)', active_no_revenue: '사업중(매출X)',
  preparing: '예비창업자', validating: '아이템검증', exploring: '탐색중',
}

const NAV_GROUPS = [
  {
    label: '관리',
    items: [
      { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
      { id: 'members', label: '멤버 관리', icon: Users },
      { id: 'attendance', label: '출결 관리', icon: Calendar },
      { id: 'checklist', label: '체크리스트', icon: CheckSquare },
    ],
  },
  {
    label: '서비스',
    items: [
      { id: 'schedule', label: '커피챗 스케줄', icon: Coffee },
      { id: 'board', label: '게시판', icon: Megaphone },
      { id: 'mentoring', label: '멘토링', icon: UserCheck },
      { id: 'revenue', label: '매출 관리', icon: DollarSign },
    ],
  },
]

export default function AdminDashboard({ profile, members }: { profile: any; members: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState('dashboard')
  const [todayAttendance, setTodayAttendance] = useState<any[]>([])
  const [weeklyChecks, setWeeklyChecks] = useState(0)

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  useEffect(() => {
    if (tab !== 'dashboard') return
    const load = async () => {
      const [{ data: att }, { data: checks }] = await Promise.all([
        supabase.from('attendance').select('user_id, status').eq('date', today),
        supabase.from('daily_checks').select('id').gte('date', weekAgo).not('content_link', 'is', null),
      ])
      setTodayAttendance(att || [])
      setWeeklyChecks(checks?.length || 0)
    }
    load()
  }, [tab])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const presentCount = todayAttendance.filter(a => a.status === 'present').length
  const absentCount = members.length - todayAttendance.length
  const stats = {
    total: members.length,
    active: members.filter(m => m.business_status === 'active_revenue').length,
    preparing: members.filter(m => ['preparing', 'validating', 'exploring'].includes(m.business_status)).length,
  }

  const STEP_CARDS = [
    {
      num: '01', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
      title: '출결 관리', desc: '수업별 출석 체크',
      stat1: { label: '오늘 출석', value: presentCount },
      stat2: { label: '미체크', value: absentCount },
      action: '출결 체크 →', tab: 'attendance',
    },
    {
      num: '02', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
      title: '데일리 과제', desc: '이번 주 콘텐츠 제출',
      stat1: { label: '이번 주 제출', value: weeklyChecks },
      stat2: { label: '전체 회원', value: members.length },
      action: '멤버 보기 →', tab: 'members',
    },
    {
      num: '03', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100',
      title: '체크리스트', desc: '수업 항목 진행 현황',
      stat1: { label: '사업 중', value: stats.active },
      stat2: { label: '예비창업자', value: stats.preparing },
      action: '체크리스트 →', tab: 'checklist',
    },
    {
      num: '04', icon: Coffee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100',
      title: '커피챗 스케줄', desc: '1:1 미팅 예약 관리',
      stat1: { label: '전체 멤버', value: stats.total },
      stat2: { label: '활성 멤버', value: stats.active + stats.preparing },
      action: '스케줄 관리 →', tab: 'schedule',
    },
  ]

  const renderContent = () => {
    switch (tab) {
      case 'attendance': return <div className="p-6"><AttendanceManageTab members={members} /></div>
      case 'checklist': return <div className="p-6"><ChecklistManageTab members={members} adminId={profile.id} /></div>
      case 'schedule': return <div className="p-6 max-w-2xl"><ScheduleManageTab adminId={profile.id} /></div>
      case 'revenue': return <div className="p-6"><RevenueTab members={members} adminId={profile.id} /></div>
      case 'board': return <div className="p-6"><BoardManageTab adminId={profile.id} /></div>
      case 'mentoring': return <div className="p-6 text-gray-500 text-sm">멘토링 준비 중</div>
      case 'members': return (
        <div className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">멤버 관리</h2>
            <p className="text-sm text-gray-500 mt-0.5">전체 {members.length}명</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['이름', '이메일', '현황', '사업 아이템', '가입일'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {m.name?.[0] || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{m.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{m.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                        {STATUS_LABEL[m.business_status] || '미입력'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-48">
                      <span className="truncate block">{m.business_item || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{m.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">등록된 회원이 없습니다</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
      default: return (
        <div className="p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">AFTERBIZ CONTROL</p>
              <h1 className="text-2xl font-bold text-gray-900">한 눈에 보는 현황</h1>
            </div>
            <p className="text-sm text-gray-400">각 카드를 클릭하면 해당 관리 페이지로 이동합니다</p>
          </div>

          {/* 4단계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STEP_CARDS.map(card => {
              const Icon = card.icon
              return (
                <div key={card.num} className={`bg-white border ${card.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setTab(card.tab)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={18} className={card.color} />
                    </div>
                    <span className="text-2xl font-black text-gray-100">{card.num}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">{card.title}</p>
                  <p className="text-xs text-gray-400 mb-4">{card.desc}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">{card.stat1.label}</p>
                      <p className="text-xl font-bold text-gray-900">{card.stat1.value}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div>
                      <p className="text-xs text-gray-400">{card.stat2.label}</p>
                      <p className="text-xl font-bold text-gray-900">{card.stat2.value}</p>
                    </div>
                  </div>
                  <button className={`text-xs font-semibold ${card.color} flex items-center gap-1 hover:gap-2 transition-all`}>
                    {card.action}
                  </button>
                </div>
              )
            })}
          </div>

          {/* 멤버 테이블 + 할 일 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 최근 멤버 */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">최근 가입 멤버</h3>
                <button onClick={() => setTab('members')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  전체 보기 <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {members.slice(0, 6).map(m => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                      {m.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{m.name || '이름 없음'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.business_item || m.email}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                      {STATUS_LABEL[m.business_status] || '미입력'}
                    </span>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">아직 가입한 회원이 없습니다</div>
                )}
              </div>
            </div>

            {/* 할 일 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">이어 할 작업</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: AlertCircle, color: 'text-red-500 bg-red-50', label: '미체크 출결', value: absentCount, tab: 'attendance' },
                  { icon: Clock, color: 'text-yellow-500 bg-yellow-50', label: '이번 주 데일리 제출', value: weeklyChecks, tab: 'members' },
                  { icon: Users, color: 'text-blue-500 bg-blue-50', label: '전체 멤버', value: stats.total, tab: 'members' },
                  { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50', label: '사업 중', value: stats.active, tab: 'members' },
                  { icon: CheckSquare, color: 'text-purple-500 bg-purple-50', label: '예비창업자', value: stats.preparing, tab: 'members' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.label} onClick={() => setTab(item.tab)}
                      className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                      <div className={`w-7 h-7 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} className={item.color.split(' ')[0]} />
                      </div>
                      <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
        {/* 로고 */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-100">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">퇴근후창업</p>
            <p className="text-xs text-gray-400 leading-tight">{ROLE_LABEL[profile.role]}</p>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-4">
              <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
              <div className="space-y-0.5 px-2">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      tab === id
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                    <Icon size={16} className="flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 프로필 + 로그아웃 */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
              {profile.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{profile.name}</p>
              <p className="text-xs text-gray-400 truncate">{ROLE_LABEL[profile.role]}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}
