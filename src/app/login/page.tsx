'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Zap, TrendingUp, CheckCircle, Users } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('이메일 또는 비밀번호가 올바르지 않습니다'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (['super_admin', 'admin_kihyun', 'admin_youngeun'].includes(profile?.role || '')) {
      router.push('/admin')
    } else {
      router.push('/member')
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const handleKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 — 로그인 폼 */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          {/* 로고 */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">퇴근후창업</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
            퇴근후창업,<br />
            <span className="text-blue-600">시작해볼까요?</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">실행하는 창업자들의 커뮤니티</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="이메일 주소 입력" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                <button type="button" className="text-xs text-blue-500 hover:text-blue-600">비밀번호 찾기</button>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              {loading ? '로그인 중...' : <>로그인하기 <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">또는 소셜 로그인</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleGoogle}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.68-2.7.68-2.08 0-3.84-1.4-4.47-3.29H1.87v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.51 10.44A4.8 4.8 0 0 1 4.26 9c0-.5.09-.97.25-1.44V5.49H1.87A8 8 0 0 0 .98 9c0 1.29.31 2.5.89 3.51l2.64-2.07z"/>
                  <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.49l2.63 2.06c.63-1.89 2.38-3.97 4.47-3.97z"/>
                </svg>
                Google
              </button>
              <button onClick={handleKakao}
                className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#F0D800] rounded-xl py-2.5 text-sm font-medium text-[#191919] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.7 5.08 4.27 6.47L5.1 21l4.5-2.4c.78.13 1.58.2 2.4.2 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
                </svg>
                카카오
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              아직 계정이 없으신가요? <span className="text-blue-600 font-medium">참여 신청하기</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 오른쪽 — 비주얼 */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md w-full">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <Zap size={12} /> 창업 실행 커뮤니티
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            매일 실행으로<br />
            <span className="text-blue-400">증명하는 창업 성과</span>
          </h2>

          <p className="text-gray-400 text-sm mb-10 leading-relaxed">
            데일리 콘텐츠 제출부터 출결 관리, 성장 그래프까지.<br />
            실행력을 데이터로 증명합니다.
          </p>

          {/* 스탯 카드 */}
          <div className="space-y-3">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">데일리 콘텐츠 트래킹</p>
                <p className="text-gray-400 text-xs">조회수 · 반응도 · 기분 · 난이도 기록</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-blue-400 text-lg font-bold">매일</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">신호등 실행 시스템</p>
                <p className="text-gray-400 text-xs">출석 · 숙제 · 기여도로 성과 측정</p>
              </div>
              <div className="ml-auto">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">그룹 멘토링 네트워킹</p>
                <p className="text-gray-400 text-xs">커피챗 · 그룹 피드 · 멘토 매칭</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-purple-400 text-sm font-bold">1:1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
