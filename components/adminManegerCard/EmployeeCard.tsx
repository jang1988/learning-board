import Link from 'next/link'
import styles from './EmployeeCard.module.css'
import RoleBadge from './RoleBadge'

export default function EmployeeCard({ employee }: any) {
	const scoreColor =
		employee.avgScore >= 80
			? styles.cardSuccess
			: employee.avgScore >= 60
				? styles.cardWarning
				: styles.cardDanger

	const isActive = employee.done > 0 || (employee.quiz_results?.length ?? 0) > 0
	
	const initials = employee.full_name
		?.split(' ')
		.slice(0, 2)
		.map((w: string) => w[0])
		.join('')
		.toUpperCase()

	return (
		<Link
			href={`/admin/users/${employee.id}`}
			className={`${styles.card} ${scoreColor}`}
		>
			<div className={styles.cardHeader}>
				<div className={styles.left}>
					<div className={styles.avatar}>{initials}</div>

					<div>
						<div className={styles.empName}>{employee.full_name}</div>

						<div className={styles.dept}>{employee.department || 'Без відділу'}</div>
					</div>
				</div>

				<div className={`${styles.status} ${isActive ? styles.active : styles.inactive}`}>
					<span />
					{isActive ? 'Active' : 'Inactive'}
				</div>
			</div>

			<div className={styles.cardBody}>
				<div className={styles.progressRing}>
					<svg viewBox="0 0 100 100">
						<defs>
							<linearGradient
								id={`gradient-${employee.id}`}
								x1="0%"
								y1="0%"
								x2="100%"
								y2="100%"
							>
								<stop
									offset="0%"
									stopColor="#6ee7b7"
								/>

								<stop
									offset="100%"
									stopColor="#047857"
								/>
							</linearGradient>
						</defs>

						<circle
							className={styles.track}
							cx="50"
							cy="50"
							r="42"
						/>

						<circle
							cx="50"
							cy="50"
							r="42"
							className={styles.indicator}
							style={{
								stroke: `url(#gradient-${employee.id})`,
								strokeDasharray: 264,
								strokeDashoffset: 264 - (employee.pct / 100) * 264
							}}
						/>
					</svg>

					<div className={styles.progressValue}>{employee.pct}%</div>
				</div>

				<div className={styles.kpis}>
					<div className={styles.kpi}>
						<span>Теми</span>
						<strong>
							{employee.done}/{employee.total}
						</strong>
					</div>

					<div className={styles.kpi}>
						<span>Бал</span>
						<strong>{employee.avgScore ?? '-'}%</strong>
					</div>

					<div className={styles.kpi}>
						<span>Тестів</span>
						<strong>{employee.quiz_results?.length ?? 0}</strong>
					</div>

					<div className={styles.kpi}>
						<span>Роль</span>
						<RoleBadge currentRole={employee.role} />
					</div>
				</div>
			</div>
		</Link>
	)
}
