'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, LayoutDashboard, Link2, CheckSquare, BookOpen, LogOut, Menu, X, TrendingUp, Target, Coffee, Users, Megaphone, CalendarDays } from 'lucide-react'
import DailyCheckTab from './tabs/DailyCheckTab'
import BusinessTab from './tabs/BusinessTab'
import AttendanceTab from './tabs/AttendanceTab'
import GrowthTab from './tabs/GrowthTab'
import GoalsTab from './tabs/GoalsTab'
import CoffeeChatTab from './tabs/CoffeeChatTab'
import GroupTab from './tabs/GroupTab'
import NoticesTab from './tabs/NoticesTab'
import MemberEventsTab from './tabs/EventsTab'

const NAV = [
  { id: 'home', label: '내 현황', icon: LayoutDashboard },
  { id: 'notices', label: '공지사항', icon: Megaphone },
  { id: 'events', label: '스팟 이벤트', icon: CalendarDays },
  { id: 'daily', label: '데일리 체크', icon: Link2 },
  { id: 'growth', label: '성장 그래프', icon: TrendingUp },
  { id: 'goals', label: '목표 & 희망', icon: Target },
  { id: 'group', label: '그룹 피드', icon: Users },
  { id: 'coffeechat', label: '커피챗 신청', icon: Coffee },
  { id: 'business', label: '내 사업', icon: CheckSquare },
  { id: 'attendance', label: '출결 확인', icon: BookOpen },
]

type Profile = {
  id: string; name: string; email: string; role: string
  business_status: string | null; business_item: string | null
}

const STATUS_LABEL: Record<string, string> = {
  active_revenue: '사업 중 (매출 있음)',
  active_no_revenue: '사업 중 (매출 없음)',
  preparing: '예비 창업자',
  validating: '아이템 검증 중',
  exploring: '탐색 중',
}

export default function MemberDashboard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusLabel = STATUS_LABEL[profile.business_status || ''] || '회원'

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* 사이드바 (데스크톱) */}
      <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-800">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">퇴근후창업</span>
        </div>
        <div className="p-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{statusLabel}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tab === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-800 hover:text-red-400 transition-colors">
            <LogOut size={16} />로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-gray-900 border-b border-gray-800 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center"><Zap size={14} className="text-white" /></div>
          <span className="font-bold text-white text-sm">퇴근후창업</span>
        </div>
        <button onClick={() => setMenuOpen(v => !v)} className="text-gray-400">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-gray-950/90 pt-14">
          <div className="bg-gray-900 border-b border-gray-800 p-2 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${tab === id ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400">
              <LogOut size={16} />로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {tab === 'home' && (
          <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-white mb-1">안녕하세요, {profile.name}님 👋</h1>
            <p className="text-sm text-gray-500 mb-8">{statusLabel}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: '데일리 체크', desc: '오늘 콘텐츠 제출', id: 'daily', color: 'bg-blue-600/20 border-blue-800' },
                { label: '성장 그래프', desc: '조회수 · 출결 추이', id: 'growth', color: 'bg-purple-600/20 border-purple-800' },
                { label: '내 사업', desc: '사업 현황 정리', id: 'business', color: 'bg-emerald-600/20 border-emerald-800' },
                { label: '출결 확인', desc: '수업 출결 현황', id: 'attendance', color: 'bg-yellow-600/20 border-yellow-800' },
              ].map(card => (
                <button key={card.id} onClick={() => setTab(card.id)}
                  className={`border rounded-2xl p-4 text-left hover:opacity-90 transition-opacity ${card.color}`}>
                  <p className="text-sm font-bold text-white">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                </button>
              ))}
            </div>

            {profile.business_item && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">내 사업 아이템</p>
                <p className="text-sm text-gray-200">{profile.business_item}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'notices' && <NoticesTab />}
        {tab === 'events' && <MemberEventsTab userId={profile.id} />}
        {tab === 'daily' && <DailyCheckTab userId={profile.id} />}
        {tab === 'growth' && <GrowthTab userId={profile.id} profile={profile} />}
        {tab === 'goals' && <GoalsTab profile={profile} />}
        {tab === 'group' && <GroupTab userId={profile.id} />}
        {tab === 'coffeechat' && <CoffeeChatTab userId={profile.id} />}
        {tab === 'business' && <BusinessTab profile={profile} />}
        {tab === 'attendance' && <AttendanceTab userId={profile.id} />}
      </main>
    </div>
  )
}
