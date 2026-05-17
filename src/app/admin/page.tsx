import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'admin_kihyun', 'admin_youngeun']
  if (!profile || !adminRoles.includes(profile.role)) {
    redirect('/member')
  }

  // 전체 회원 목록
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'in', '("super_admin","admin_kihyun","admin_youngeun")')
    .order('created_at', { ascending: false })

  return <AdminDashboard profile={profile} members={members || []} />
}
