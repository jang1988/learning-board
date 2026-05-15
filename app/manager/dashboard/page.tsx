import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'

export default async function ManagerDashboard() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) redirect('/auth/login')

	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

	// Темы + уроки + прогресс уроков
	const { data: topics } = await supabase
		.from('topics')
		.select(
			`
      id,
      title,
      order_index,
      lessons(
        id,
        lesson_progress(status, user_id)
      )
    `
		)
		.order('order_index')

	// 👉 считаем прогресс ПРАВИЛЬНО (без topic_progress)
	const enrichedTopics =
		topics?.map(topic => {
			const lessons = topic.lessons ?? []

			const lessonsTotal = lessons.length

			const lessonsDone = lessons.filter((l: any) =>
				l.lesson_progress?.some((p: any) => p.user_id === user.id && p.status === 'completed')
			).length

			const status =
				lessonsDone === 0
					? 'not_started'
					: lessonsDone === lessonsTotal
						? 'completed'
						: 'in_progress'

			const pct = lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0

			return {
				...topic,
				lessonsDone,
				lessonsTotal,
				status,
				pct
			}
		}) ?? []

	const total = enrichedTopics.length

	const completed = enrichedTopics.filter(t => t.status === 'completed').length

	const inProgress = enrichedTopics.filter(t => t.status === 'in_progress').length

	// последние тесты
	const { data: recentResults } = await supabase
		.from('quiz_results')
		.select('*, quizzes(title, topics(title))')
		.eq('user_id', user.id)
		.order('submitted_at', { ascending: false })
		.limit(3)

	return (
		<div className={styles.page}>
			<div className={styles.welcome}>
				<div>
					<h1 className={styles.welcomeTitle}>
						Ласкаво просимо, {profile?.full_name?.split(' ')[0]} 👋
					</h1>
					<p className={styles.welcomeSub}>Продовжуйте навчання з того місця, де зупинилися</p>
				</div>
			</div>

			{/* STATS */}
			<div className={styles.stats}>
				<div className={styles.stat}>
					<div className={styles.statNum}>{total}</div>
					<div className={styles.statLabel}>Усього тем</div>
				</div>

				<div className={styles.stat}>
					<div
						className={styles.statNum}
						style={{ color: 'var(--color-accent)' }}
					>
						{completed}
					</div>
					<div className={styles.statLabel}>Завершено</div>
				</div>

				<div className={styles.stat}>
					<div
						className={styles.statNum}
						style={{ color: 'var(--color-primary)' }}
					>
						{inProgress}
					</div>
					<div className={styles.statLabel}>В процесі</div>
				</div>

				<div className={styles.stat}>
					<div className={styles.statNum}>
						{total > 0 ? Math.round((completed / total) * 100) : 0}%
					</div>
					<div className={styles.statLabel}>Загальний прогрес</div>
				</div>
			</div>

			{/* PROGRESS BAR */}
			<div className={styles.progressSection}>
				<div className="progress-bar">
					<div
						className="progress-bar__fill progress-bar__fill--success"
						style={{
							width: `${total > 0 ? (completed / total) * 100 : 0}%`
						}}
					/>
				</div>
			</div>

			<div className={styles.grid}>
				{/* TOPICS */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>Мої теми</h2>
						<Link
							href="/manager/topics"
							className={styles.seeAll}
						>
							Усі теми →
						</Link>
					</div>

					<div className={styles.topicList}>
						{enrichedTopics.slice(0, 4).map(topic => (
							<Link
								href={`/manager/topics/${topic.id}`}
								key={topic.id}
								className={styles.topicCard}
							>
								<div className={styles.topicCardTop}>
									<span className={styles.topicTitle}>{topic.title}</span>

									<span
										className={`badge ${
											topic.status === 'completed'
												? 'badge--green'
												: topic.status === 'in_progress'
													? 'badge--blue'
													: 'badge--gray'
										}`}
									>
										{topic.status === 'completed'
											? '✓ Готово'
											: topic.status === 'in_progress'
												? 'У процесі'
												: 'Не розпочато'}
									</span>
								</div>

								{topic.status !== 'not_started' && (
									<div style={{ marginTop: 10 }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												fontSize: 12,
												color: 'var(--color-text-3)',
												marginBottom: 4
											}}
										>
											<span>
												{topic.lessonsDone} / {topic.lessonsTotal} уроків
											</span>
											<span>{topic.pct}%</span>
										</div>

										<div className="progress-bar">
											<div
												className={`progress-bar__fill ${
													topic.status === 'completed' ? 'progress-bar__fill--success' : ''
												}`}
												style={{ width: `${topic.pct}%` }}
											/>
										</div>
									</div>
								)}
							</Link>
						))}
					</div>
				</section>

				{/* QUIZZES */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>Останні тести</h2>
					</div>

					{recentResults && recentResults.length > 0 ? (
						<div className={styles.resultList}>
							{recentResults.map(r => {
								const isPending = r.status === 'pending'
								return (
									<div
										key={r.id}
										className={styles.resultCard}
									>
										<div className={styles.resultInfo}>
											<div className={styles.resultTopic}>{(r.quizzes as any)?.topics?.title}</div>
											<div className={styles.resultQuiz}>{(r.quizzes as any)?.title}</div>
											{isPending && <div className={styles.resultPending}>⏳ Очікує перевірки</div>}
										</div>
										{isPending ? (
											<div className={styles.resultScorePending}>⏳</div>
										) : (
											<div
												className={`${styles.resultScore} ${r.passed ? styles.passed : styles.failed}`}
											>
												{r.percent}%
											</div>
										)}
									</div>
								)
							})}
						</div>
					) : (
						<div className={styles.empty}>
							Ви ще не проходили тести.
							<br />
							Завершіть урок, щоб розблокувати тест.
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
