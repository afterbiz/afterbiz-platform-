'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, MessageCircle, Link2, ExternalLink, Users } from 'lucide-react'

type GroupMember = { user_id: string; profiles: { name: string } }
type DailyPost = {
  user_id: string; date: string; content_link: string; views: number; mood: string
  profiles: { name: string }
  reactions: { user_id: string; type: string; comment: string }[]
}

const MOOD_EMOJI: Record<string, string> = {
  great: '😄', good: '😊', neutral: '😐', bad: '😞', terrible: '😫'
}

export default function GroupTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [groupMembers, setGroupMembers] = useState<string[]>([])
  const [feed, setFeed] = useState<DailyPost[]>([])
  const [commenting, setCommenting] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  useEffect(() => { loadGroups() }, [])
  useEffect(() => { if (selectedGroup) loadFeed() }, [selectedGroup])

  const loadGroups = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name)')
      .eq('user_id', userId)
    const groups = data?.map((d: any) => d.groups).filter(Boolean) || []
    setMyGroups(groups)
    if (groups[0]) setSelectedGroup(groups[0].id)
    setLoading(false)
  }

  const loadFeed = async () => {
    const { data: members } = await supabase
      .from('group_members').select('user_id').eq('group_id', selectedGroup)
    const memberIds = members?.map((m: any) => m.user_id) || []
    setGroupMembers(memberIds)

    if (memberIds.length === 0) { setFeed([]); return }

    const { data } = await supabase
      .from('daily_checks')
      .select('user_id, date, content_link, views, mood, profiles(name)')
      .in('user_id', memberIds)
      .gte('date', weekAgo)
      .not('content_link', 'is', null)
      .order('date', { ascending: false })
      .limit(30)

    if (!data) { setFeed([]); return }

    const ids = data.map((d: any) => `${d.user_id}_${d.date}`)
    const reactionsData: any[] = []
    for (const item of data) {
      const { data: r } = await supabase
        .from('daily_reactions')
        .select('user_id, type, comment')
        .eq('target_user_id', item.user_id)
        .eq('target_date', item.date)
      reactionsData.push({ key: `${item.user_id}_${item.date}`, reactions: r || [] })
    }

    setFeed(data.map((d: any) => ({
      ...d,
      reactions: reactionsData.find(r => r.key === `${d.user_id}_${d.date}`)?.reactions || []
    })))
  }

  const toggleLike = async (targetUserId: string, targetDate: string) => {
    const existing = feed.find(f => f.user_id === targetUserId && f.date === targetDate)
      ?.reactions.find(r => r.user_id === userId && r.type === 'like')
    if (existing) {
      await supabase.from('daily_reactions')
        .delete().eq('target_user_id', targetUserId).eq('target_date', targetDate).eq('user_id', userId).eq('type', 'like')
    } else {
      await supabase.from('daily_reactions').upsert({
        target_user_id: targetUserId, target_date: targetDate, user_id: userId, type: 'like'
      }, { onConflict: 'target_user_id,target_date,user_id,type' })
    }
    loadFeed()
  }

  const addComment = async (targetUserId: string, targetDate: string) => {
    if (!commentText.trim()) return
    await supabase.from('daily_reactions').insert({
      target_user_id: targetUserId, target_date: targetDate, user_id: userId, type: 'comment', comment: commentText.trim()
    })
    setCommentText('')
    setCommenting(null)
    loadFeed()
  }

  if (loading) return <div className="p-6 text-center text-gray-600 text-sm">불러오는 중...</div>

  if (myGroups.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Users size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">아직 그룹에 배정되지 않았습니다</p>
          <p className="text-gray-600 text-xs mt-1">관리자가 그룹을 배정하면 여기서 볼 수 있어요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">그룹 피드</h2>
          <p className="text-sm text-gray-500 mt-0.5">최근 7일 그룹 멤버 콘텐츠</p>
        </div>
        {myGroups.length > 1 && (
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none">
            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </div>

      {feed.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-600 text-sm">
          이번 주 그룹 멤버의 콘텐츠가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((post, i) => {
            const liked = post.reactions?.some(r => r.user_id === userId && r.type === 'like')
            const likeCount = post.reactions?.filter(r => r.type === 'like').length || 0
            const comments = post.reactions?.filter(r => r.type === 'comment') || []
            const key = `${post.user_id}_${post.date}`
            const isMe = post.user_id === userId

            return (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    {(post.profiles as any)?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{(post.profiles as any)?.name} {isMe && <span className="text-xs text-gray-600">(나)</span>}</p>
                    <p className="text-xs text-gray-600">{post.date} {post.mood && MOOD_EMOJI[post.mood]}</p>
                  </div>
                  {post.views > 0 && <span className="text-xs text-gray-600">👁 {post.views.toLocaleString()}</span>}
                </div>

                <a href={post.content_link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mb-3">
                  <Link2 size={13} className="flex-shrink-0" />
                  <span className="truncate">{post.content_link}</span>
                  <ExternalLink size={11} className="flex-shrink-0" />
                </a>

                <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                  <button onClick={() => toggleLike(post.user_id, post.date)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {likeCount > 0 && likeCount}
                  </button>
                  <button onClick={() => setCommenting(commenting === key ? null : key)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-400 transition-colors">
                    <MessageCircle size={14} />
                    {comments.length > 0 && comments.length}
                  </button>
                </div>

                {comments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {comments.map((c, ci) => (
                      <p key={ci} className="text-xs text-gray-400 bg-gray-800/60 rounded-lg px-3 py-1.5">{c.comment}</p>
                    ))}
                  </div>
                )}

                {commenting === key && (
                  <div className="mt-2 flex gap-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment(post.user_id, post.date)}
                      placeholder="댓글을 남겨주세요..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                    <button onClick={() => addComment(post.user_id, post.date)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl">등록</button>
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
