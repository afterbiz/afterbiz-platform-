'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Pin, ChevronDown, ChevronUp } from 'lucide-react'

export default function NoticesTab() {
  const supabase = createClient()
  const [notices, setNotices] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('posts')
        .select('*').eq('category', 'notice').eq('is_public', true)
        .order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
      setNotices(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">공지사항</h2>
        <p className="text-sm text-gray-500 mt-0.5">관리자의 공지를 확인하세요</p>
      </div>

      {notices.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Megaphone size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">아직 공지사항이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map(n => (
            <div key={n.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${n.is_pinned ? 'border-blue-900/40' : 'border-gray-800'}`}>
              <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-800/40 transition-colors text-left">
                {n.is_pinned && <Pin size={12} className="text-blue-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  {n.is_pinned && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full mr-2">공지</span>
                  )}
                  <span className="text-sm font-medium text-gray-200">{n.title}</span>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">{n.created_at?.slice(0, 10)}</span>
                {expandedId === n.id ? <ChevronUp size={14} className="text-gray-600 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />}
              </button>
              {expandedId === n.id && (
                <div className="px-4 pb-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed mt-3">{n.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
