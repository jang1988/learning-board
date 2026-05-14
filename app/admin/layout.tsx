import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import s from '@/components/layout/Sidebar.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') redirect('/manager/dashboard')

  return (
    <div className={s.layout}>
      <Sidebar profile={profile} />
      <main className={s.main}>
        {children}
      </main>
    </div>
  )
}
