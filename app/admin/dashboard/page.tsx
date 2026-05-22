import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'

export default async function AdminDashboard() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	// Проверка роли
	const { data: profile } = await supabase
		.from('profiles')
		.select('role, full_name')
		.eq('id', user.id)
		.single()
	if (profile?.role !== 'admin') redirect('/manager/dashboard')

	// Stats
	const { count: totalUsers } = await supabase
		.from('profiles')
		.select('*', { count: 'exact', head: true })
		.eq('role', 'manager')

	const { count: activeUsers } = await supabase
		.from('topic_progress')
		.select('user_id', { count: 'exact', head: true })
		.neq('status', 'not_started')

	const { count: totalTopics } = await supabase
		.from('topics')
		.select('*', { count: 'exact', head: true })

	const { data: quizStats } = await supabase.from('quiz_results').select('percent, passed, status')

	const checkedQuizStats = quizStats?.filter((r: any) => r.status !== 'pending') ?? []

	const pendingQuizStats = quizStats?.filter((r: any) => r.status === 'pending').length ?? 0

	const avgScore =
		checkedQuizStats.length > 0
			? Math.round(checkedQuizStats.reduce((s, r) => s + r.percent, 0) / checkedQuizStats.length)
			: 0

	const passRate =
		checkedQuizStats.length > 0
			? Math.round((checkedQuizStats.filter(r => r.passed).length / checkedQuizStats.length) * 100)
			: 0

	// Сотрудники с прогрессом
	const { data: employees } = await supabase
		.from('profiles')
		.select(
			`
      id, full_name, email, department, hired_at,
      topic_progress(status)
    `
		)
		.eq('role', 'manager')
		.order('created_at', { ascending: false })
		.limit(8)

	// Последние результаты тестов
	const { data: recentResults } = await supabase
		.from('quiz_results')
		.select('*, profiles(full_name), quizzes(title, topics(title))')
		.order('submitted_at', { ascending: false })
		.limit(5)

	return (
		<div className={styles.page}>
			<div className={styles.topBar}>
				<div>
					<h1 className={styles.title}>Дашборд</h1>
					<p className={styles.sub}>Огляд прогресу навчання працівників</p>
				</div>
				<div className={styles.topActions}>
					<Link
						href="/admin/topics/new"
						className={styles.btnPrimary}
					>
						+ Нова тема
					</Link>
				</div>
			</div>

			{/* KPI Cards */}
			<div className={styles.kpiGrid}>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{ background: '#EFF6FF', color: '#2563EB' }}
					>
						◎
					</div>
					<div>
						<div className={styles.kpiNum}>{totalUsers ?? 0}</div>
						<div className={styles.kpiLabel}>Робітників</div>
					</div>
				</div>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{ background: '#ECFDF5', color: '#10B981' }}
					>
						↗
					</div>
					<div>
						<div className={styles.kpiNum}>{activeUsers ?? 0}</div>
						<div className={styles.kpiLabel}>Активних</div>
					</div>
				</div>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{ background: '#FFFBEB', color: '#F59E0B' }}
					>
						▤
					</div>
					<div>
						<div className={styles.kpiNum}>{totalTopics ?? 0}</div>
						<div className={styles.kpiLabel}>Тем</div>
					</div>
				</div>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{ background: '#EFF6FF', color: '#2563EB' }}
					>
						✓
					</div>
					<div>
						<div className={styles.kpiNum}>{avgScore}%</div>
						<div className={styles.kpiLabel}>Середній балл</div>
					</div>
				</div>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{ background: '#ECFDF5', color: '#10B981' }}
					>
						★
					</div>
					<div>
						<div className={styles.kpiNum}>{passRate}%</div>
						<div className={styles.kpiLabel}>Здали тести</div>
					</div>
				</div>
				<div className={styles.kpiCard}>
					<div
						className={styles.kpiIcon}
						style={{
							background: '#FFFBEB',
							color: '#F59E0B'
						}}
					>
						⏳
					</div>

					<div>
						<div className={styles.kpiNum}>{pendingQuizStats}</div>

						<div className={styles.kpiLabel}>Очікують</div>
					</div>
				</div>
			</div>

			<div className={styles.grid}>
				{/* Employees table */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>Співробітники</h2>
						<Link
							href="/admin/users"
							className={styles.seeAll}
						>
							Все →
						</Link>
					</div>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Співробітник</th>
								<th>Отділ</th>
								<th>Прогрес</th>
								<th>Завершено</th>
							</tr>
						</thead>
						<tbody>
							{employees?.map(emp => {
								const total = emp.topic_progress?.length ?? 0
								const done =
									emp.topic_progress?.filter((p: any) => p.status === 'completed').length ?? 0
								const pct = total > 0 ? Math.round((done / total) * 100) : 0
								return (
									<tr key={emp.id}>
										<td>
											<div className={styles.empName}>{emp.full_name}</div>
											<div className={styles.empEmail}>{emp.email}</div>
										</td>
										<td>
											<span className={styles.dept}>{emp.department ?? '—'}</span>
										</td>
										<td style={{ minWidth: 120 }}>
											<div className={styles.miniBar}>
												<div
													className="progress-bar"
													style={{ flex: 1 }}
												>
													<div
														className={`progress-bar__fill ${pct === 100 ? 'progress-bar__fill--success' : ''}`}
														style={{ width: `${pct}%` }}
													/>
												</div>
												<span className={styles.miniPct}>{pct}%</span>
											</div>
										</td>
										<td>
											<span
												className={`badge ${done === total && total > 0 ? 'badge--green' : 'badge--gray'}`}
											>
												{done}/{total}
											</span>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</section>

				{/* Recent quiz results */}
				<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>Останні тести</h2>

						<Link
							href="/admin/reports"
							className={styles.seeAll}
						>
							Звіти →
						</Link>
					</div>

					<div className={styles.resultList}>
						{recentResults?.map(r => {
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

										<div className={styles.quizPendingSub}>{(r.profiles as any)?.full_name}</div>

										<div className={styles.quizPendingMeta}>
											{(r.quizzes as any)?.topics?.title}
										</div>
									</div>
								)
							}

							return (
								<div
									key={r.id}
									className={styles.resultRow}
								>
									<div className={styles.resultUser}>
										<div className={styles.resultName}>{(r.profiles as any)?.full_name}</div>

										<div className={styles.resultMeta}>{(r.quizzes as any)?.topics?.title}</div>
									</div>

									<div className={styles.resultRight}>
										<span className={`${styles.score} ${r.passed ? styles.pass : styles.fail}`}>
											{r.percent}%
										</span>

										<span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>
											{r.passed ? 'Здав' : 'Не здав'}
										</span>
									</div>
								</div>
							)
						})}

						{(!recentResults || recentResults.length === 0) && (
							<div className={styles.empty}>Результатів поки що немає</div>
						)}
					</div>
				</section>
			</div>
		</div>
	)
}
