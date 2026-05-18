'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, MapPin, Users, Check, X } from 'lucide-react'

type Event = {
  id: string; title: string; description: string
  event_date: string; location: string; max_attendees: number
  is_public: boolean; created_at: string
  event_attendees?: { count: number }[]
}

export default function EventsTab({ adminId, members }: { adminId: string; members: any[] }) {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [attendees, setAttendees] = useState<Record<string, any[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '',
    max_attendees: '', is_public: true
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date')
    setEvents(data || [])
  }

  const loadAttendees = async (eventId: string) => {
    const { data } = await supabase
      .from('event_attendees')
      .select('user_id, status, profiles(name, phone)')
      .eq('event_id', eventId)
    setAttendees(prev => ({ ...prev, [eventId]: data || [] }))
  }

  const handleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    loadAttendees(id)
  }

  const handleSave = async () => {
    if (!form.title || !form.event_date) return
    await supabase.from('events').insert({
      title: form.title, description: form.description,
      event_date: form.event_date, location: form.location,
      max_attendees: Number(form.max_attendees) || null,
      is_public: form.is_public, created_by: adminId
    })
    setForm({ title: '', description: '', event_date: '', location: '', max_attendees: '', is_public: true })
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('이벤트를 삭제할까요?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  const upd = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }))

  const isUpcoming = (e: Event) => new Date(e.event_date) >= new Date()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-blue-400" /> 스팟 이벤트
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">어드민나이트, 커피모임, IR 등 행사 관리</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          <Plus size={14} /> 이벤트 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-blue-900/40 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1.5">이벤트 이름 *</label>
              <input placeholder="예: 어드민나이트, 창업아이템찾기" value={form.title}
                onChange={e => upd('title')(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">날짜/시간 *</label>
              <input type="datetime-local" value={form.event_date} onChange={e => upd('event_date')(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">장소</label>
              <input placeholder="예: 강남 OO카페" value={form.location} onChange={e => upd('location')(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">최대 인원</label>
              <input type="number" placeholder="제한 없으면 비워두세요" value={form.max_attendees}
                onChange={e => upd('max_attendees')(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <div onClick={() => upd('is_public')(!form.is_public)}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${form.is_public ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_public ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-400">회원에게 공개</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1.5">설명</label>
              <textarea placeholder="이벤트 설명..." value={form.description} onChange={e => upd('description')(e.target.value)}
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg">취소</button>
            <button onClick={handleSave} disabled={!form.title || !form.event_date}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
              <Check size={13} /> 저장
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-600 text-sm">
            아직 등록된 이벤트가 없습니다
          </div>
        ) : (
          events.map(ev => {
            const evAttendees = attendees[ev.id] || []
            const dateStr = new Date(ev.event_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            const upcoming = isUpcoming(ev)

            return (
              <div key={ev.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${upcoming ? 'border-blue-900/40' : 'border-gray-800 opacity-70'}`}>
                <button onClick={() => handleExpand(ev.id)}
                  className="w-full px-5 py-4 flex items-start gap-4 hover:bg-gray-800/30 transition-colors text-left">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${upcoming ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
                    <Calendar size={16} className={upcoming ? 'text-blue-400' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white">{ev.title}</p>
                      {upcoming && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">예정</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={11} />{dateStr}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(ev.id) }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </button>

                {expandedId === ev.id && (
                  <div className="px-5 pb-4 border-t border-gray-800">
                    {ev.description && <p className="text-sm text-gray-400 mt-3 mb-3">{ev.description}</p>}
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={13} className="text-gray-500" />
                      <span className="text-xs text-gray-500">참석 신청 {evAttendees.filter(a => a.status === 'attending').length}명</span>
                    </div>
                    {evAttendees.length > 0 ? (
                      <div className="space-y-1">
                        {evAttendees.filter(a => a.status === 'attending').map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                            <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                              {(a.profiles as any)?.name?.[0] || '?'}
                            </div>
                            {(a.profiles as any)?.name} <span className="text-gray-600">{(a.profiles as any)?.phone}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-700">아직 참석 신청이 없습니다</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
