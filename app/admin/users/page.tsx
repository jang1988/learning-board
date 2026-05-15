import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import styles from './users.module.css'

export default async function AdminUsers() {
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

	const { data: employees } = await supabase
		.from('profiles')
		.select(
			`
      *,
      topic_progress(status, topic_id),
      quiz_results(percent, passed, status)
    `
		)
		.eq('role', 'manager')
		.order('created_at', { ascending: false })

	const { count: topicsTotal } = await supabase
		.from('topics')
		.select('*', { count: 'exact', head: true })

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Співробітники</h1>
					<p className={styles.sub}>{employees?.length ?? 0} зареєстровано</p>
				</div>
			</div>

			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Співробітник</th>
							<th>Відділ</th>
							<th>Дата найму</th>
							<th>Прогрес</th>
							<th>Тем завершено</th>
							<th>Ср. бал</th>
							<th>Роль</th>
						</tr>
					</thead>
					<tbody>
						{employees?.map(emp => {
							const done =
								emp.topic_progress?.filter((p: any) => p.status === 'completed').length ?? 0
							const total = topicsTotal ?? 0
							const pct = total > 0 ? Math.round((done / total) * 100) : 0
							const results = emp.quiz_results ?? []

							const checkedResults = results.filter((r: any) => r.status !== 'pending')

							const avgScore =
								checkedResults.length > 0
									? Math.round(
											checkedResults.reduce((s: number, r: any) => s + r.percent, 0) /
												checkedResults.length
										)
									: null

							return (
								<tr key={emp.id}>
									<td>
										<div className={styles.empRow}>
											<div className={styles.avatar}>
												{emp.full_name
													.split(' ')
													.slice(0, 2)
													.map((w: string) => w[0])
													.join('')
													.toUpperCase()}
											</div>
											<div>
												<div className={styles.empName}>{emp.full_name}</div>
												<div className={styles.empEmail}>{emp.email}</div>
											</div>
										</div>
									</td>
									<td>
										<span className={styles.dept}>{emp.department ?? '—'}</span>
									</td>
									<td>
										<span className={styles.date}>
											{emp.hired_at ? new Date(emp.hired_at).toLocaleDateString('ru-RU') : '—'}
										</span>
									</td>
									<td style={{ minWidth: 140 }}>
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
											<span className={styles.pct}>{pct}%</span>
										</div>
									</td>
									<td>
										<span
											className={`badge ${done === total && total > 0 ? 'badge--green' : 'badge--gray'}`}
										>
											{done} / {total}
										</span>
									</td>
									<td>
										{avgScore !== null ? (
											<span
												className={`${styles.score} ${avgScore >= 70 ? styles.good : styles.bad}`}
											>
												{avgScore}%
											</span>
										) : (
											<span className={styles.noData}>—</span>
										)}
									</td>
									<td>
										<RoleToggle
											userId={emp.id}
											currentRole={emp.role}
										/>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

// Server component can't handle clicks — this is a placeholder
// In real app, make this a Client Component with server action
function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
	return (
		<span className={`badge ${currentRole === 'admin' ? 'badge--blue' : 'badge--gray'}`}>
			{currentRole === 'admin' ? 'Адмін' : 'Співробітник'}
		</span>
	)
}
