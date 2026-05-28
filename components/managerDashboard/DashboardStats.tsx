import styles from './DashboardStats.module.css'

export function DashboardStats({ stats }: any) {
	const { total, completed, inProgress } = stats
	
	return (
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
	)
}