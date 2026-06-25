import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import styles from './modules.module.css'

import CreateModule from '@/components/adminModules/CreateModule'
import { ModuleCard } from '@/components/adminModules/ModuleCard'

export default async function AdminModulesPage() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) redirect('/auth/login')

	const [{ data: modules }, { data: topics }] = await Promise.all([
		supabase
			.from('modules')
			.select(
				`
				*,
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
			`
			)
			.order('order_index'),

		supabase.from('topics').select('id,title').order('title')
	])

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Модулі навчання</h1>

					<p className={styles.sub}>{modules?.length ?? 0} модулів</p>
				</div>
			</div>

			<CreateModule />

			<div className={styles.list}>
				{modules?.map(module => (
					<ModuleCard
						key={module.id}
						module={module}
						allTopics={topics ?? []}
					/>
				))}

				{modules?.length === 0 && (
					<div className={styles.empty}>
						<h3>Модулів ще немає</h3>

						<p>Створіть перший модуль</p>
					</div>
				)}
			</div>
		</div>
	)
}