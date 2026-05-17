'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Check, X } from 'lucide-react'

type Member = { id: string; name: string }
type ChecklistItem = { id: string; title: string; category: string; order_num: number }
type Progress = { item_id: string; status: string; admin_checked: boolean; admin_note: string }

const CATEGORIES = ['콘텐츠', '마케팅', '사업', '네트워킹', '일반']
const CATEGORY_COLOR: Record<string, string> = {
  '콘텐츠': 'bg-blue-500/20 text-blue-400',
  '마케팅': 'bg-purple-500/20 text-purple-400',
  '사업': 'bg-emerald-500/20 text-emerald-400',
  '네트워킹': 'bg-yellow-500/20 text-yellow-400',
  '일반': 'bg-gray-700 text-gray-400',
}

export default function ChecklistManageTab({ members, adminId }: { members: Member[]; adminId: string }) {
  const supabase = createClient()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [selectedMember, setSelectedMember] = useState<string>(members[0]?.id || '')
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category: '일반' })
  const [view, setView] = useState<'items' | 'progress'>('items')

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    if (selectedMember) loadProgress(selectedMember)
  }, [selectedMember, items])

  const loadItems = async () => {
    const { data } = await supabase.from('checklist_items').select('*').eq('is_active', true).order('order_num')
    setItems(data || [])
  }

  const loadProgress = async (userId: string) => {
    const { data } = await supabase.from('checklist_progress').select('*').eq('user_id', userId)
    const map: Record<string, Progress> = {}
    data?.forEach((p: Progress) => { map[p.item_id] = p })
    setProgress(map)
  }

  const addItem = async () => {
    if (!newItem.title.trim()) return
    await supabase.from('checklist_items').insert({
      title: newItem.title.trim(),
      category: newItem.category,
      created_by: adminId,
      order_num: items.length,
    })
    setNewItem({ title: '', category: '일반' })
    setShowForm(false)
    loadItems()
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm('이 항목을 삭제할까요?')) return
    await supabase.from('checklist_items').update({ is_active: false }).eq('id', id)
    loadItems()
  }

  const toggleAdminCheck = async (itemId: string, current: boolean) => {
    await supabase.from('checklist_progress').upsert(
      { user_id: selectedMember, item_id: itemId, admin_checked: !current, status: !current ? 'completed' : 'in_progress' },
      { onConflict: 'user_id,item_id' }
    )
    loadProgress(selectedMember)
  }

  const selectedMemberName = members.find(m => m.id === selectedMember)?.name || ''

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">수업 체크리스트</h2>
          <p className="text-sm text-gray-500 mt-0.5">항목 관리 및 회원별 진행 상황 확인</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {(['items', 'progress'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === v ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {v === 'items' ? '항목 관리' : '진행 상황'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">
            <Plus size={13} /> 항목 추가
          </button>
        </div>
      </div>

      {/* 항목 추가 폼 */}
      {showForm && (
        <div className="bg-gray-900 border border-blue-900/40 rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1.5">항목명</label>
            <input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="예: 블로그 1개 발행, SNS 계정 개설..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">카테고리</label>
            <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={addItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1"><Check size={14} /> 저장</button>
          <button onClick={() => setShowForm(false)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg"><X size={14} /></button>
        </div>
      )}

      {/* 항목 목록 */}
      {view === 'items' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {items.length === 0 ? (
            <div className="p-10 text-center text-gray-600 text-sm">아직 체크리스트 항목이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {items.map((item, i) => (
                <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                  <span className="text-xs text-gray-700 w-5 font-mono">{i + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLOR[item.category]}`}>{item.category}</span>
                  <span className="flex-1 text-sm text-gray-200">{item.title}</span>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 회원별 진행 상황 */}
      {view === 'progress' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">회원 선택:</label>
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {selectedMemberName && (
              <span className="text-sm text-gray-500">
                완료: {Object.values(progress).filter(p => p.admin_checked).length} / {items.length}개
              </span>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {items.length === 0 ? (
              <div className="p-10 text-center text-gray-600 text-sm">항목을 먼저 추가해주세요</div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {items.map(item => {
                  const p = progress[item.id]
                  const adminChecked = p?.admin_checked || false
                  return (
                    <div key={item.id} className={`px-5 py-4 flex items-center gap-4 transition-colors ${adminChecked ? 'bg-emerald-950/20' : ''}`}>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLOR[item.category]}`}>{item.category}</span>
                      <span className={`flex-1 text-sm ${adminChecked ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{item.title}</span>
                      <button
                        onClick={() => toggleAdminCheck(item.id, adminChecked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          adminChecked
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-emerald-500/40 hover:text-emerald-400'
                        }`}
                      >
                        <Check size={12} />
                        {adminChecked ? '확인 완료' : '확인'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
