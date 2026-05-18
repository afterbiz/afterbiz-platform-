'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Zap, LogIn } from 'lucide-react'
import { Suspense } from 'react'

function AttendContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'login' | 'error'>('loading')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus('login')
        return
      }

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      setUserName(profile?.name || user.email || '')

      // 이미 출석했는지 확인
      const { data: existing } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', user.id)
        .eq('date', date)
        .single()

      if (existing) {
        setStatus('already')
        return
      }

      // 출석 처리
      const { error } = await supabase.from('attendance').upsert(
        { user_id: user.id, date, status: 'present' },
        { onConflict: 'user_id,date' }
      )

      setStatus(error ? 'error' : 'success')
    }

    check()
  }, [date])

  if (status === 'login') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn size={28} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
        <p className="text-gray-400 text-sm mb-6">출석 체크를 하려면 먼저 로그인하세요</p>
        <button
          onClick={() => router.push(`/login?redirect=/attend?date=${date}`)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
        >
          로그인하기
        </button>
      </div>
    </div>
  )

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">출석 처리 중...</p>
      </div>
    </div>
  )

  if (status === 'already') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={36} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">이미 출석했어요!</h2>
        <p className="text-gray-400 text-sm mb-1">{userName}님</p>
        <p className="text-gray-600 text-xs">{date} 출석 완료</p>
        <button onClick={() => router.push('/member')} className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl">
          대시보드로
        </button>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={44} className="text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">출석 완료! ✅</h2>
        <p className="text-gray-300 text-lg mb-1">{userName}님</p>
        <p className="text-gray-500 text-sm mb-8">{date} 출석이 기록됐습니다</p>
        <button onClick={() => router.push('/member')} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">
          대시보드로 이동
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400">오류가 발생했습니다. 다시 시도해주세요.</p>
      </div>
    </div>
  )
}

export default function AttendPage() {
  return (
    <Suspense>
      <AttendContent />
    </Suspense>
  )
}
