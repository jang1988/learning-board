import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import styles from './reports.module.css'

export default async function AdminReports() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single()
	if (profile?.role !== 'admin') redirect('/manager/dashboard')

	// Все результаты тестов с деталями
	const { data: results } = await supabase
		.from('quiz_results')
		.select(
			`
      *,
      profiles(full_name, email, department),
      quizzes(title, passing_score, topics(title))
    `
		)
		.order('submitted_at', { ascending: false })

	// Топики со статистикой
	const { data: topics } = await supabase
		.from('topics')
		.select(
			`
      id, title,
      topic_progress(status)
    `
		)
		.order('order_index')

	// Агрегация по темам
	const topicStats = topics?.map(t => {
		const progs = t.topic_progress ?? []
		const total = progs.length
		const completed = progs.filter((p: any) => p.status === 'completed').length
		const inProgress = progs.filter((p: any) => p.status === 'in_progress').length
		return { ...t, total, completed, inProgress }
	})

	const totalResults = results?.length ?? 0
	const passedResults = results?.filter(r => r.passed).length ?? 0
	const avgScore =
		totalResults > 0 ? Math.round(results!.reduce((s, r) => s + r.percent, 0) / totalResults) : 0

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Звіти</h1>
					<p className={styles.sub}>Аналітика по тестам і прогресу навчання</p>
				</div>
			</div>

			{/* Summary stats */}
			<div className={styles.statRow}>
				<div className={styles.statCard}>
					<div className={styles.statNum}>{totalResults}</div>
					<div className={styles.statLabel}>Спроб тестів</div>
				</div>
				<div className={styles.statCard}>
					<div
						className={styles.statNum}
						style={{ color: 'var(--color-accent)' }}
					>
						{passedResults}
					</div>
					<div className={styles.statLabel}>Успішних</div>
				</div>
				<div className={styles.statCard}>
					<div
						className={styles.statNum}
						style={{ color: 'var(--color-danger)' }}
					>
						{totalResults - passedResults}
					</div>
					<div className={styles.statLabel}>Провалено</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNum}>{avgScore}%</div>
					<div className={styles.statLabel}>Середній бал</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNum}>
						{totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0}%
					</div>
					<div className={styles.statLabel}>Відсоток здачі</div>
				</div>
			</div>

			<div className={styles.grid}>
				{/* Topics progress summary */}
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>Прогрес на теми</h2>
					<div className={styles.topicStats}>
						{topicStats?.map(t => {
							const pct = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0
							return (
								<div
									key={t.id}
									className={styles.topicRow}
								>
									<div className={styles.topicName}>{t.title}</div>
									<div className={styles.topicMeta}>
										<span className="badge badge--green">{t.completed} завершили</span>
										<span className="badge badge--blue">{t.inProgress} вчаться</span>
									</div>
									<div className={styles.topicBarWrap}>
										<div
											className="progress-bar"
											style={{ flex: 1 }}
										>
											<div
												className={`progress-bar__fill ${pct === 100 ? 'progress-bar__fill--success' : ''}`}
												style={{ width: `${pct}%` }}
											/>
										</div>
										<span className={styles.topicPct}>{pct}%</span>
									</div>
								</div>
							)
						})}
					</div>
				</section>

				{/* Full quiz results */}
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>Усі результати тестів</h2>
					<div className={styles.resultsTable}>
						<div className={styles.rHead}>
							<span>Співробітник</span>
							<span>Тест</span>
							<span>Бал</span>
							<span>Дата</span>
						</div>
						{results?.map(r => (
							<div
								key={r.id}
								className={styles.rRow}
							>
								<div>
									<div className={styles.rName}>{(r.profiles as any)?.full_name}</div>
									<div className={styles.rDept}>{(r.profiles as any)?.department ?? ''}</div>
								</div>
								<div>
									<div className={styles.rQuiz}>{(r.quizzes as any)?.title}</div>
									<div className={styles.rTopic}>{(r.quizzes as any)?.topics?.title}</div>
								</div>
								<div className={styles.rScore}>
									<span className={`${styles.scoreNum} ${r.passed ? styles.pass : styles.fail}`}>
										{r.percent}%
									</span>
									<span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>
										{r.passed ? '✓' : '✕'}
									</span>
								</div>
								<div className={styles.rDate}>
									{new Date(r.submitted_at).toLocaleDateString('ru-RU', {
										day: '2-digit',
										month: '2-digit',
										year: '2-digit'
									})}
								</div>
							</div>
						))}
						{(!results || results.length === 0) && (
							<div className={styles.empty}>Результатів поки що немає</div>
						)}
					</div>
				</section>
			</div>
		</div>
	)
}