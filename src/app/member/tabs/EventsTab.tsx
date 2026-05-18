'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Users, Check, X } from 'lucide-react'

export default function MemberEventsTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [myRsvps, setMyRsvps] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: evs }, { data: rsvps }] = await Promise.all([
      supabase.from('events').select('*').eq('is_public', true).order('event_date'),
      supabase.from('event_attendees').select('event_id, status').eq('user_id', userId)
    ])
    setEvents(evs || [])
    const map: Record<string, string> = {}
    rsvps?.forEach(r => { map[r.event_id] = r.status })
    setMyRsvps(map)
    setLoading(false)
  }

  const handleRsvp = async (eventId: string, current: string | undefined) => {
    if (current === 'attending') {
      await supabase.from('event_attendees')
        .update({ status: 'cancelled' }).eq('event_id', eventId).eq('user_id', userId)
    } else {
      await supabase.from('event_attendees')
        .upsert({ event_id: eventId, user_id: userId, status: 'attending' }, { onConflict: 'event_id,user_id' })
    }
    load()
  }

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date())
  const past = events.filter(e => new Date(e.event_date) < new Date())

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">스팟 이벤트</h2>
        <p className="text-sm text-gray-500 mt-0.5">예정된 행사에 참석 신청하세요</p>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Calendar size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">예정된 이벤트가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(ev => {
            const rsvp = myRsvps[ev.id]
            const isAttending = rsvp === 'attending'
            const dateStr = new Date(ev.event_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })

            return (
              <div key={ev.id} className={`bg-gray-900 rounded-2xl border p-5 ${isAttending ? 'border-emerald-800' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{ev.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar size={11} />{dateStr}
                    </p>
                    {ev.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />{ev.location}
                      </p>
                    )}
                  </div>
                  {isAttending && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-shrink-0">
                      ✓ 참석 예정
                    </span>
                  )}
                </div>

                {ev.description && (
                  <p className="text-xs text-gray-500 mb-3 bg-gray-800/40 rounded-lg px-3 py-2">{ev.description}</p>
                )}

                <button onClick={() => handleRsvp(ev.id, rsvp)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    isAttending
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {isAttending ? <><X size={14} /> 참석 취소</> : <><Check size={14} /> 참석 신청</>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium">지난 이벤트</p>
          {past.map(ev => (
            <div key={ev.id} className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 opacity-60">
              <Calendar size={13} className="text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-400">{ev.title}</span>
              <span className="text-xs text-gray-600 ml-auto">
                {new Date(ev.event_date).toLocaleDateString('ko-KR')}
              </span>
              {myRsvps[ev.id] === 'attending' && <span className="text-xs text-gray-600">참석함</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
