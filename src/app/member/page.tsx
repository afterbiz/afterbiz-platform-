import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberDashboard from './MemberDashboard'

export default async function MemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // 관리자면 관리자 페이지로
  if (['super_admin', 'admin_kihyun', 'admin_youngeun'].includes(profile.role)) {
    redirect('/admin')
  }

  return <MemberDashboard profile={profile} />
}
