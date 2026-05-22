import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import styles from './results.module.css'

export default async function ManagerResults() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	// Профіль
	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

	// === Теми + уроки + прогрес (основний запит) ===
	const { data: topicsRaw } = await supabase
		.from('topics')
		.select(
			`
      id, 
      title, 
      is_required, 
      order_index,
      lessons (
        id,
        lesson_progress!left(status, completed_at, user_id)
      )
    `
		)
		.order('order_index')

	// Обчислюємо прогрес на льоту (як у Dashboard)
	const enrichedTopics = (topicsRaw ?? []).map((topic: any) => {
		const lessons = topic.lessons ?? []

		const lessonsTotal = lessons.length

		const completedLessonsData = lessons
			.flatMap((lesson: any) => lesson.lesson_progress || [])
			.filter((p: any) => p.user_id === user.id && p.status === 'completed')

		const lessonsDone = completedLessonsData.length

		const status =
			lessonsDone === 0 ? 'not_started' : lessonsDone === lessonsTotal ? 'completed' : 'in_progress'

		const pct = lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0

		// Дата завершення теми (останніший completed_at)
		const completed_at =
			completedLessonsData.length > 0
				? completedLessonsData.sort(
						(a: any, b: any) =>
							new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
					)[0].completed_at
				: null

		return {
			...topic,
			lessonsTotal,
			lessonsDone,
			status,
			pct,
			completed_at
		}
	})

	// === Результати тестів ===
	const { data: quizResults } = await supabase
		.from('quiz_results')
		.select(
			`
      *,
      quizzes(title, passing_score, topics(id, title))
    `
		)
		.eq('user_id', user.id)
		.order('submitted_at', { ascending: false })

	// === Нещодавно завершені уроки ===
	const { data: lessonProgress } = await supabase
		.from('lesson_progress')
		.select('status, completed_at, lessons(title, topic_id, topics(title))')
		.eq('user_id', user.id)
		.eq('status', 'completed')
		.order('completed_at', { ascending: false })

	// === Підрахунок статистики ===
	const totalTopics = enrichedTopics.length

	const completedTopics = enrichedTopics.filter(t => t.status === 'completed').length

	const inProgressTopics = enrichedTopics.filter(t => t.status === 'in_progress').length

	const requiredTopics = enrichedTopics.filter(t => t.is_required).length

	const completedRequired = enrichedTopics.filter(
		t => t.is_required && t.status === 'completed'
	).length

	// ✅ pending не враховуємо як "не здано"
	const checkedResults = quizResults?.filter(r => r.status !== 'pending') ?? []

	const pendingQuizzes = quizResults?.filter(r => r.status === 'pending').length ?? 0

	const totalQuizzes = checkedResults.length

	const passedQuizzes = checkedResults.filter(r => r.passed).length

	const failedQuizzes = checkedResults.filter(r => !r.passed).length

	const avgScore =
		checkedResults.length > 0
			? Math.round(checkedResults.reduce((s, r) => s + r.percent, 0) / checkedResults.length)
			: 0

	// Найкращі результати по кожному тесту
	type QuizResult = NonNullable<typeof quizResults>[0]
	const bestResults: Record<string, QuizResult> = {}
	quizResults?.forEach(r => {
		const qId = r.quiz_id
		if (!bestResults[qId] || r.percent > bestResults[qId].percent) {
			bestResults[qId] = r
		}
	})

	const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Мої результати</h1>
					<p className={styles.sub}>Прогрес навчання та результати тестів</p>
				</div>
			</div>

			{/* Загальний прогрес */}
			<div className={styles.overallCard}>
				<div className={styles.overallLeft}>
					<div
						className={styles.overallCircle}
						style={{ '--pct': `${overallPct}` } as any}
					>
						<div className={styles.overallInner}>
							<span className={styles.overallNum}>{overallPct}%</span>
							<span className={styles.overallLabel}>завершено</span>
						</div>
					</div>
				</div>
				<div className={styles.overallRight}>
					<div className={styles.overallTitle}>Загальний прогрес навчання</div>
					<div className={styles.overallSub}>
						{completedRequired} з {requiredTopics} обов'язкових тем пройдено
					</div>
					<div className={styles.overallBar}>
						<div
							className="progress-bar"
							style={{ height: 10, borderRadius: 99 }}
						>
							<div
								className={`progress-bar__fill ${overallPct === 100 ? 'progress-bar__fill--success' : ''}`}
								style={{ width: `${overallPct}%` }}
							/>
						</div>
					</div>
					<div className={styles.overallStats}>
						<div className={styles.oStat}>
							<span
								className={styles.oNum}
								style={{ color: 'var(--color-accent)' }}
							>
								{completedTopics}
							</span>
							<span className={styles.oLabel}>Завершено</span>
						</div>
						<div className={styles.oStat}>
							<span
								className={styles.oNum}
								style={{ color: 'var(--color-primary)' }}
							>
								{inProgressTopics}
							</span>
							<span className={styles.oLabel}>В процесі</span>
						</div>
						<div className={styles.oStat}>
							<span className={styles.oNum}>
								{totalTopics - completedTopics - inProgressTopics}
							</span>
							<span className={styles.oLabel}>Не розпочато</span>
						</div>
						<div className={styles.oStat}>
							<span
								className={styles.oNum}
								style={{ color: avgScore >= 80 ? 'var(--color-accent)' : 'var(--color-danger)' }}
							>
								{avgScore > 0 ? `${avgScore}%` : '—'}
							</span>
							<span className={styles.oLabel}>Ср. бал</span>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.grid}>
				{/* Прогрес по темах */}
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>Прогрес на теми</h2>
					<div className={styles.topicList}>
						{enrichedTopics.map(topic => {
							const { status, pct, lessonsTotal, completed_at } = topic

							return (
								<Link
									href={`/manager/topics/${topic.id}`}
									key={topic.id}
									className={styles.topicRow}
								>
									<div className={styles.topicLeft}>
										<div
											className={`${styles.topicStatus} ${
												status === 'completed'
													? styles.statusDone
													: status === 'in_progress'
														? styles.statusProgress
														: styles.statusNone
											}`}
										>
											{status === 'completed' ? '✓' : status === 'in_progress' ? '▶' : '○'}
										</div>
										<div>
											<div className={styles.topicName}>{topic.title}</div>
											<div className={styles.topicMeta}>
												{lessonsTotal} уроків
												{topic.is_required && <span className={styles.reqBadge}>обов'язкова</span>}
											</div>
										</div>
									</div>

									<div className={styles.topicRight}>
										{status !== 'not_started' && (
											<div className={styles.topicBarWrap}>
												<div
													className="progress-bar"
													style={{ width: 80 }}
												>
													<div
														className={`progress-bar__fill ${
															status === 'completed' ? 'progress-bar__fill--success' : ''
														}`}
														style={{ width: `${pct}%` }}
													/>
												</div>
												<span className={styles.topicPct}>{pct}%</span>
											</div>
										)}

										{status === 'not_started' && (
											<span className="badge badge--gray">Не розпочато</span>
										)}

										{completed_at && (
											<span className={styles.completedAt}>
												{new Date(completed_at).toLocaleDateString('ru-RU', {
													day: '2-digit',
													month: 'short'
												})}
											</span>
										)}
									</div>
								</Link>
							)
						})}
					</div>
				</section>

				<div className={styles.rightCol}>
					{/* Тести */}
					<section className={styles.section}>
						<h2 className={styles.sectionTitle}>Тести</h2>

						<div className={styles.quizSummary}>
							<div className={styles.qStat}>
								<span
									className={styles.qNum}
									style={{ color: 'var(--color-accent)' }}
								>
									{passedQuizzes}
								</span>

								<span className={styles.qLabel}>здано</span>
							</div>

							<div className={styles.qDivider} />

							<div className={styles.qStat}>
								<span
									className={styles.qNum}
									style={{ color: 'var(--color-danger)' }}
								>
									{failedQuizzes}
								</span>

								<span className={styles.qLabel}>не здано</span>
							</div>

							<div className={styles.qDivider} />

							<div className={styles.qStat}>
								<span
									className={styles.qNum}
									style={{ color: '#D97706' }}
								>
									{pendingQuizzes}
								</span>

								<span className={styles.qLabel}>очікують</span>
							</div>

							<div className={styles.qDivider} />

							<div className={styles.qStat}>
								<span
									className={styles.qNum}
									style={{
										color: avgScore >= 80 ? 'var(--color-accent)' : 'var(--color-danger)'
									}}
								>
									{avgScore > 0 ? `${avgScore}%` : '—'}
								</span>

								<span className={styles.qLabel}>середній</span>
							</div>
						</div>

						<div className={styles.quizList}>
							{Object.values(bestResults).map(r => {
								const isPending = r.status === 'pending'

								if (isPending) {
									return (
										<div
											key={r.id}
											className={styles.quizPending}
										>
											<div className={styles.quizPendingIcon}>
												<div className={styles.pendingSpinner}></div>
											</div>

											<div className={styles.quizPendingText}>Тест очікує перевірки</div>

											<div className={styles.quizPendingSub}>
												Андрій або Геннадій перевірять ваші відповіді найближчим часом
											</div>
										</div>
									)
								}

								return (
									<div
										key={r.id}
										className={styles.quizRow}
									>
										<div className={styles.quizInfo}>
											<div className={styles.quizTopic}>{(r.quizzes as any)?.topics?.title}</div>
										</div>

										<div className={styles.quizRight}>
											<span
												className={`${styles.quizScore} ${
													r.passed ? styles.scorePassed : styles.scoreFailed
												}`}
											>
												{r.percent}%
											</span>

											<span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>
												{r.passed ? 'Здано' : 'Не здано'}
											</span>
										</div>
									</div>
								)
							})}

							{Object.keys(bestResults).length === 0 && (
								<div className={styles.empty}>Тести ще не проходили</div>
							)}
						</div>
					</section>

					{/* Історія спроб */}
					{quizResults && quizResults.length > 0 && (
						<section className={styles.section}>
							<h2 className={styles.sectionTitle}>Історія спроб</h2>

							<div className={styles.historyList}>
								{quizResults.slice(0, 10).map(r => {
									const isPending = r.status === 'pending'

									return (
										<div
											key={r.id}
											className={styles.historyRow}
										>
											<div className={styles.historyLeft}>
												<span
													className={`${styles.historyDot} ${
														isPending
															? styles.dotPending
															: r.passed
																? styles.dotGreen
																: styles.dotRed
													}`}
												/>

												<div>
													<div className={styles.historyQuiz}>{(r.quizzes as any)?.title}</div>

													<div className={styles.historyDate}>
														{new Date(r.submitted_at).toLocaleDateString('ru-RU', {
															day: '2-digit',
															month: 'short',
															year: 'numeric'
														})}
														{' · '}
														спроба #{r.attempt_num}
													</div>
												</div>
											</div>

											{isPending ? (
												<span className={styles.historyPending}></span>
											) : (
												<span
													className={`${styles.historyScore} ${
														r.passed ? styles.scorePassed : styles.scoreFailed
													}`}
												>
													{r.percent}%
												</span>
											)}
										</div>
									)
								})}
							</div>
						</section>
					)}
				</div>
			</div>

			{/* Нещодавно завершені уроки */}
			{lessonProgress && lessonProgress.length > 0 && (
				<section
					className={styles.section}
					style={{ marginTop: 20 }}
				>
					<h2 className={styles.sectionTitle}>Нещодавно переглянуті уроки</h2>
					<div className={styles.lessonGrid}>
						{lessonProgress.slice(0, 6).map((lp, i) => (
							<div
								key={i}
								className={styles.lessonChip}
							>
								<span className={styles.lessonChipIcon}>✓</span>
								<div>
									<div className={styles.lessonChipTitle}>{(lp.lessons as any)?.title}</div>
									<div className={styles.lessonChipTopic}>{(lp.lessons as any)?.topics?.title}</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	)
}
