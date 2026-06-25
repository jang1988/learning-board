import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import styles from './module.module.css'

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params

	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) redirect('/auth/login')

	const { data: module } = await supabase
		.from('modules')
		.select(
			`
    id,
    title,
    description,
    color,
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
		.eq('id', id)
		.single()

	if (!module) {
		return (
			<div className={styles.page}>
				<h1>Module not found</h1>
			</div>
		)
	}

	return (
		<div className={styles.page}>
			<div
				className={styles.header}
				style={{
					background: module.color || '#22c55e'
				}}
			>
				<h1>{module.title}</h1>

				{module.description && <p>{module.description}</p>}

				<span>{module.module_topics?.length ?? 0} тем</span>
			</div>

			<div className={styles.topics}>
				{module.module_topics
					?.sort((a: any, b: any) => a.order_index - b.order_index)
					.map((mt: any) => (
						<Link
							key={mt.id}
							href={`/manager/topics/${mt.topic.id}`}
							className={styles.topic}
						>
							<div className={styles.topicHeader}>
								<div className={styles.num}>{mt.order_index + 1}</div>
							<h3>{mt.topic.title}</h3>
							</div>


							{mt.topic.description && <p>{mt.topic.description}</p>}
						</Link>
					))}
			</div>
		</div>
	)
}
