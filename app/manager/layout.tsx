import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import s from '@/components/layout/Sidebar.module.css'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Получить профиль, если нет — создать дефолтный
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Користувач',
        role: 'manager',
      })
      .select()
      .single()
    profile = newProfile
  }

  if (!profile) redirect('/auth/login')

  // Если вдруг admin зашёл на /manager — пустить, сайдбар покажет правильное меню
  return (
    <DashboardShell profile={profile}>
			{children}
		</DashboardShell>
  )
}
