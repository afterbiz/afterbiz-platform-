'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Check, ChevronRight } from 'lucide-react'

const BUSINESS_STATUS = [
  { value: 'active_revenue', label: '이미 사업 중', sub: '현재 매출이 발생하고 있어요' },
  { value: 'active_no_revenue', label: '시작했지만 매출 없음', sub: '사업은 시작했지만 수익화 전이에요' },
  { value: 'preparing', label: '예비 창업자', sub: '창업을 준비하고 있어요' },
  { value: 'validating', label: '아이템 검증 필요', sub: '아이디어는 있지만 시장 반응이 궁금해요' },
  { value: 'exploring', label: '아직 탐색 중', sub: '어떤 사업을 할지 고민 중이에요' },
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    business_status: '',
    business_item: '',
    want_help_from: '',
  })

  const upd = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: 'member' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 프로필 추가 정보 업데이트
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        name: form.name,
        phone: form.phone,
        business_status: form.business_status,
        business_item: form.business_item,
        want_help_from: form.want_help_from,
      })
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">신청 완료!</h2>
          <p className="text-gray-400 text-sm mb-1">이메일을 확인해주세요.</p>
          <p className="text-gray-500 text-xs mb-6">인증 메일을 클릭하면 로그인할 수 있습니다.</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm underline">
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">퇴근후창업</span>
          </div>
          <p className="text-sm text-gray-500">참여 신청서</p>
        </div>

        {/* 진행 바 */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        {/* Step 1: 계정 정보 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">계정 정보</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">이메일 *</label>
              <input type="email" placeholder="example@email.com" value={form.email}
                onChange={(e) => upd('email')(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">비밀번호 * (6자 이상)</label>
              <input type="password" placeholder="비밀번호 입력" value={form.password}
                onChange={(e) => upd('password')(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">이름 *</label>
              <input type="text" placeholder="홍길동" value={form.name}
                onChange={(e) => upd('name')(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">연락처</label>
              <input type="tel" placeholder="010-0000-0000" value={form.phone}
                onChange={(e) => upd('phone')(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <button
              onClick={() => {
                if (!form.email || !form.password || !form.name) { setError('필수 항목을 입력해주세요'); return }
                setError(''); setStep(2)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              다음 <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: 현재 상황 */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white mb-4">현재 상황을 알려주세요 *</h2>
            {BUSINESS_STATUS.map((opt) => (
              <button key={opt.value} onClick={() => upd('business_status')(opt.value)}
                className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${form.business_status === opt.value ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${form.business_status === opt.value ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                  {form.business_status === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                </div>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl text-sm">이전</button>
              <button onClick={() => { if (!form.business_status) { setError('현재 상황을 선택해주세요'); return } setError(''); setStep(3) }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                다음 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 사업 정보 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">사업 정보</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">사업 아이템 / 아이디어</label>
              <textarea placeholder="예: 핸드메이드 소품 스마트스토어, 영양사 식단 코칭 서비스..." value={form.business_item}
                onChange={(e) => upd('business_item')(e.target.value)} rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">어떤 회사/기관의 도움을 받고 싶으신가요?</label>
              <textarea placeholder="예: 투자사 연결, 법무 지원, 마케팅 에이전시..." value={form.want_help_from}
                onChange={(e) => upd('want_help_from')(e.target.value)} rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl text-sm">이전</button>
              <button onClick={handleSignup} disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm">
                {loading ? '신청 중...' : '신청 완료'}
              </button>
            </div>
          </div>
        )}

        {error && step !== 3 && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">로그인</Link>
        </p>
      </div>
    </div>
  )
}
