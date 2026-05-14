import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import styles from './topics.module.css'

export default async function AdminTopics() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	const { data: topics } = await supabase
		.from('topics')
		.select(
			`
      *,
      lessons(count),
      quizzes(count),
      topic_progress(status)
    `
		)
		.order('order_index')

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Теми навчання</h1>
					<p className={styles.sub}>{topics?.length ?? 0} тем у системі</p>
				</div>
				<Link
					href="/admin/topics/new"
					className={styles.btnNew}
				>
					+ Створити тему
				</Link>
			</div>

			<div className={styles.list}>
				{topics?.map((topic, idx) => {
					const total = topic.topic_progress?.length ?? 0
					const completed =
						topic.topic_progress?.filter((p: any) => p.status === 'completed').length ?? 0
					return (
						<div
							key={topic.id}
							className={styles.card}
						>
							<div className={styles.cardLeft}>
								<div className={styles.order}>#{idx + 1}</div>
								<div>
									<div className={styles.topicTitle}>{topic.title}</div>
									{topic.description && <div className={styles.topicDesc}>{topic.description}</div>}
									<div className={styles.meta}>
										<span>📹 {(topic.lessons as any)?.[0]?.count ?? 0} уроків</span>
										<span>📝 {(topic.quizzes as any)?.[0]?.count ?? 0} тестів</span>
										<span>👥 {total} співробітників</span>
										<span className={styles.metaGreen}>✓ {completed} завершили</span>
									</div>
								</div>
							</div>
							<div className={styles.cardRight}>
								<span className={`badge ${topic.is_required ? 'badge--blue' : 'badge--gray'}`}>
									{topic.is_required ? 'Обов\'язкова' : 'Опціональна'}
								</span>
								<Link
									href={`/admin/topics/${topic.id}`}
									className={styles.editBtn}
								>
									Редагувати →
								</Link>
							</div>
						</div>
					)
				})}

				{(!topics || topics.length === 0) && (
					<div className={styles.empty}>
						<div className={styles.emptyIcon}>▤</div>
						<div className={styles.emptyTitle}>Тем поки що ні</div>
						<p className={styles.emptySub}>Створіть першу тему навчання</p>
						<Link
							href="/admin/topics/new"
							className={styles.btnNew}
						>
							+ Створити тему
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}
