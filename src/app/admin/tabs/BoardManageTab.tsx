'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Pin, Edit3, Trash2, ChevronDown, ChevronUp, Megaphone, X, Check } from 'lucide-react'

type Notice = { id: string; title: string; content: string; category: string; is_pinned: boolean; created_at: string }

const TABS = ['전체', '멤버 전체', '출결 안내', '과제 공지', '이벤트']
const CATEGORIES = ['멤버 전체', '출결 안내', '과제 공지', '이벤트']

export default function BoardManageTab({ adminId }: { adminId: string }) {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('전체')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: '멤버 전체', is_pinned: false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('posts')
      .select('*').eq('category', 'notice').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    setNotices((data || []) as Notice[])
    setLoaded(true)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => notices.filter(n => {
    const matchTab = activeTab === '전체' || n.category === activeTab
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  }), [notices, activeTab, search])

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('posts').update({ ...form, category: 'notice', updated_at: new Date().toISOString() }).eq('id', editingId)
    } else {
      await supabase.from('posts').insert({ ...form, category: 'notice', author_id: adminId, is_public: true })
    }
    setForm({ title: '', content: '', category: '멤버 전체', is_pinned: false })
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    await load()
  }

  const handleEdit = (n: Notice) => {
    setForm({ title: n.title, content: n.content, category: n.category || '멤버 전체', is_pinned: n.is_pinned })
    setEditingId(n.id)
    setShowForm(true)
    setExpandedId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await supabase.from('posts').delete().eq('id', id)
    await load()
  }

  const handleTogglePin = async (n: Notice) => {
    await supabase.from('posts').update({ is_pinned: !n.is_pinned }).eq('id', n.id)
    await load()
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">공지사항</h2>
          <p className="text-sm text-gray-500 mt-0.5">멤버들에게 공지를 작성하고 관리합니다</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', content: '', category: '멤버 전체', is_pinned: false }) }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          <Plus size={15} /> 공지 작성
        </button>
      </div>

      {/* 공지 작성 폼 */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">{editingId ? '공지 수정' : '새 공지 작성'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input placeholder="공지 제목을 입력하세요" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <textarea placeholder="공지 내용을 입력하세요..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setForm(p => ({ ...p, is_pinned: !p.is_pinned }))}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.is_pinned ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_pinned ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-600">상단 고정</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl">
                  <Check size={14} /> {saving ? '저장 중...' : editingId ? '수정 완료' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="공지 검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === t ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
          </button>
        ))}
      </div>

      {/* 공지 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center">
          <Megaphone size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">등록된 공지사항이 없습니다</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
            + 첫 공지 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${n.is_pinned ? 'border-blue-200' : 'border-gray-200'}`}>
              <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                {n.is_pinned && <Pin size={13} className="text-blue-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{n.category || '전체'}</span>
                    {n.is_pinned && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">고정</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{n.created_at?.slice(0, 10)}</span>
                {expandedId === n.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
              </button>

              {expandedId === n.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-4 mb-4">{n.content}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => handleTogglePin(n)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${n.is_pinned ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      <Pin size={11} /> {n.is_pinned ? '고정 해제' : '상단 고정'}
                    </button>
                    <button onClick={() => handleEdit(n)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                      <Edit3 size={11} /> 수정
                    </button>
                    <button onClick={() => handleDelete(n.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium border border-red-100">
                      <Trash2 size={11} /> 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
