import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ModuleViewer } from '@/components/managerModules/ModuleViewer'
import styles from './modules.module.css'

export default async function ManagerModulesPage() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) redirect('/auth/login')

	const { data: modules } = await supabase
  .from('modules')
  .select(`
    id,
    title,
    description,
    color,
    order_index,
    module_topics(
      id,
      order_index,
      is_required,
      topic:topics(
        id,
        title,
        description,
        cover_url
      )
    )
  `)
  .order('order_index')

	return (
		<div className={styles.page}>
			<div>
				<h1 className={styles.welcomeTitle}>Категорії курсів</h1>
				<p className={styles.welcomeSub}>Обирай категорію та вивчайте теми послідовно</p>
			</div>

			<ModuleViewer modules={modules ?? []} />
		</div>
	)
}
