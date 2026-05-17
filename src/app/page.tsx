import Link from 'next/link'
import { Zap, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-white">퇴근후창업</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            참여 신청
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <Zap size={12} /> 매달 스팟 행사 운영 중
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          퇴근 후,<br />
          <span className="text-blue-400">실행</span>으로 창업을 완성합니다
        </h1>

        <p className="text-lg text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
          예비 창업자부터 초기 창업자까지.<br />
          매일 콘텐츠를 만들고, 함께 성장하는 커뮤니티입니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl text-sm transition-colors">
            지금 참여 신청하기 <ArrowRight size={16} />
          </Link>
          <Link href="/login"
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 font-medium px-8 py-4 rounded-2xl text-sm transition-colors">
            기존 회원 로그인
          </Link>
        </div>

        {/* 특징 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-2xl mx-auto">
          {[
            { title: '데일리 콘텐츠', desc: '매일 콘텐츠를 만들고 조회수를 기록합니다' },
            { title: '신호등 시스템', desc: '출석·숙제·기여도로 실행력을 점수화합니다' },
            { title: '커피챗 & IR', desc: '김기현 멘토와 1:1 미팅 및 IR 행사에 참여합니다' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-blue-400" />
                <p className="text-sm font-semibold text-white">{title}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-900 py-6 text-center text-xs text-gray-700">
        퇴근후창업 © 2026
      </footer>
    </div>
  )
}
