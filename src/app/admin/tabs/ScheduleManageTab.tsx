'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Check, X, Coffee, Clock } from 'lucide-react'

type Slot = {
  id: string; date: string; time_start: string; time_end: string; title: string
  coffee_chat_bookings: { user_id: string; status: string; message: string; profiles: { name: string } }[]
}

export default function ScheduleManageTab({ adminId }: { adminId: string }) {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: '', time_start: '10:00', time_end: '10:30', title: '커피챗'
  })
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from('schedule_slots')
      .select('*, coffee_chat_bookings(user_id, status, message, profiles(name))')
      .order('date').order('time_start')
    setSlots(data || [])
  }

  const addSlot = async () => {
    if (!form.date) return
    await supabase.from('schedule_slots').insert({ ...form, host_id: adminId })
    setForm({ date: '', time_start: '10:00', time_end: '10:30', title: '커피챗' })
    setShowForm(false)
    load()
  }

  const deleteSlot = async (id: string) => {
    if (!window.confirm('슬롯을 삭제할까요?')) return
    await supabase.from('schedule_slots').delete().eq('id', id)
    load()
  }

  const updateBooking = async (bookingUserId: string, slotId: string, status: string) => {
    await supabase.from('coffee_chat_bookings')
      .update({ status })
      .eq('slot_id', slotId).eq('user_id', bookingUserId)
    load()
  }

  const upcoming = slots.filter(s => s.date >= today)
  const past = slots.filter(s => s.date < today)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coffee size={18} className="text-yellow-400" /> 커피챗 스케줄 관리
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">예약 가능한 시간을 등록하세요</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          <Plus size={14} /> 슬롯 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-blue-900/40 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">날짜</label>
              <input type="date" value={form.date} min={today} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">제목</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">시작 시간</label>
              <input type="time" value={form.time_start} onChange={e => setForm(p => ({ ...p, time_start: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">종료 시간</label>
              <input type="time" value={form.time_end} onChange={e => setForm(p => ({ ...p, time_end: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg">취소</button>
            <button onClick={addSlot} disabled={!form.date}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
              저장
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400">예정된 슬롯 ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-600 text-sm">예정된 슬롯이 없습니다</div>
        ) : (
          upcoming.map(slot => {
            const booking = slot.coffee_chat_bookings?.[0]
            return (
              <div key={slot.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{slot.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {slot.date} · {slot.time_start.slice(0,5)}~{slot.time_end.slice(0,5)}
                    </p>
                  </div>
                  <button onClick={() => deleteSlot(slot.id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-700 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
                {booking ? (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{(booking.profiles as any)?.name} 신청</p>
                        {booking.message && <p className="text-xs text-gray-500 mt-0.5">{booking.message}</p>}
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateBooking(booking.user_id, slot.id, 'confirmed')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg">
                            <Check size={12} /> 확정
                          </button>
                          <button onClick={() => updateBooking(booking.user_id, slot.id, 'cancelled')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg">
                            <X size={12} /> 거절
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && <span className="text-xs text-emerald-400">✓ 확정됨</span>}
                      {booking.status === 'cancelled' && <span className="text-xs text-red-400">거절됨</span>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 mt-2">예약 없음</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
