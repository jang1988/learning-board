import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
							<th>Прогрес</th>
							<th>Завершено</th>
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
								<tr
									key={emp.id}
									className={styles.clickableRow}
								>
									<td data-label="Співробітник">
										<Link
											href={`/admin/users/${emp.id}`}
											className={styles.userLink}
										>
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
												</div>
											</div>
										</Link>
									</td>
									<td data-label="Відділ">
										<span className={styles.dept}>{emp.department ?? '—'}</span>
									</td>
									<td
										data-label="Прогрес"
										style={{ minWidth: 140 }}
									>
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
									<td data-label="Завершено">
										<span
											className={`badge ${done === total && total > 0 ? 'badge--green' : 'badge--gray'}`}
										>
											{done} / {total}
										</span>
									</td>
									<td data-label="Ср. бал">
										{avgScore !== null ? (
											<span
												className={`${styles.score} ${avgScore >= 80 ? styles.good : styles.bad}`}
											>
												{avgScore}%
											</span>
										) : (
											<span className={styles.noData}>—</span>
										)}
									</td>
									<td data-label="Роль">
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
function RoleToggle({ currentRole }: { userId: string; currentRole: string }) {
	const isAdmin = currentRole === 'admin'

	return (
		<span className={`badge ${isAdmin ? 'badge--blue' : 'badge--gray'} ${styles.roleBadge}`}>
			{isAdmin ? 'Адмін' : 'Співробітник'}
		</span>
	)
}
