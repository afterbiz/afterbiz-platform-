'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coffee, Check, X, Clock } from 'lucide-react'

type Slot = {
  id: string; date: string; time_start: string; time_end: string
  title: string; is_available: boolean
  coffee_chat_bookings: { user_id: string; status: string; message: string }[]
}

export default function CoffeeChatTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from('schedule_slots')
      .select('*, coffee_chat_bookings(user_id, status, message)')
      .gte('date', today)
      .order('date')
      .order('time_start')
    setSlots(data || [])
    setLoading(false)
  }

  const handleBook = async (slotId: string) => {
    setBooking(true)
    await supabase.from('coffee_chat_bookings').insert({
      slot_id: slotId, user_id: userId, message, status: 'pending'
    })
    setBookingSlot(null)
    setMessage('')
    setBooking(false)
    load()
  }

  const myBooking = (slot: Slot) => slot.coffee_chat_bookings?.find(b => b.user_id === userId)
  const isBooked = (slot: Slot) => slot.coffee_chat_bookings?.some(b => b.status !== 'cancelled')

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  const upcoming = slots.filter(s => s.date >= today)

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Coffee size={20} className="text-yellow-400" />
        <div>
          <h2 className="text-lg font-bold text-white">커피챗 신청</h2>
          <p className="text-sm text-gray-500">김기현님과 1:1 미팅을 신청하세요</p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Coffee size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">현재 예약 가능한 슬롯이 없습니다</p>
          <p className="text-gray-600 text-xs mt-1">곧 일정이 등록될 예정입니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(slot => {
            const mine = myBooking(slot)
            const booked = isBooked(slot)
            const isOpen = bookingSlot === slot.id

            return (
              <div key={slot.id} className={`bg-gray-900 border rounded-2xl p-4 transition-colors ${mine?.status === 'confirmed' ? 'border-emerald-800' : booked && !mine ? 'border-gray-800 opacity-60' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{slot.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11} />
                      {slot.date} · {slot.time_start.slice(0,5)} ~ {slot.time_end.slice(0,5)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {mine ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${
                        mine.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        mine.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {mine.status === 'confirmed' ? '✓ 확정' : mine.status === 'cancelled' ? '취소됨' : '검토중'}
                      </span>
                    ) : booked ? (
                      <span className="text-xs text-gray-600">예약 완료</span>
                    ) : (
                      <button onClick={() => setBookingSlot(isOpen ? null : slot.id)}
                        className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        신청하기
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="미팅에서 나누고 싶은 이야기를 적어주세요 (선택)"
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleBook(slot.id)} disabled={booking}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">
                        <Check size={14} /> 신청 확정
                      </button>
                      <button onClick={() => setBookingSlot(null)}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
