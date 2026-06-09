import styles from '@/app/admin/users/[id]/user.module.css'

export default function TopicProgress({ data }: any) {
	function formatDateTime(value?: string | null) {
	if (!value) return '—'

	const date = new Date(value)

	return new Intl.DateTimeFormat('uk-UA', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(date)
}
	return (
		<div className={styles.section}>
			<h2>Темы</h2>

			{data.map((t: any) => {
				const pct = t.lessons_total > 0 ? Math.round((t.lessons_done / t.lessons_total) * 100) : 0

				return (
					<div
						key={t.id}
						className={styles.item}
					>
						<div className={styles.row}>
							<span>{t.topic?.title || t.topic_id}</span>
							<span>{pct}%</span>
						</div>

						<div className={styles.bar}>
							<div
								className={styles.fill}
								style={{ width: `${pct}%` }}
							/>
						</div>

						<div className={styles.timeRow}>
							<div className={styles.timeItem}>
								<span className={styles.timeLabel}>Старт</span>
								<span className={styles.timeValue}>{formatDateTime(t.started_at)}</span>
							</div>

							<div className={styles.timeItem}>
								<span className={styles.timeLabel}>Финиш</span>
								<span className={styles.timeValue}>{formatDateTime(t.completed_at)}</span>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
