import styles from './TopicProgress.module.css'

export default function TopicProgress({ data }: any) {
	function formatDateTime(value?: string | null) {
		if (!value) return '—'

		const date = new Date(value)

		return new Intl.DateTimeFormat('uk-UA', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date)
	}

	function getDurationStatus(start?: string | null, end?: string | null) {
		if (!start || !end) return null

		const startDate = new Date(start)
		const endDate = new Date(end)

		const diffMs = endDate.getTime() - startDate.getTime()
		const diffDays = diffMs / (1000 * 60 * 60 * 24)

		return diffDays > 7 ? 'danger' : 'success'
	}

	return (
		<div className={styles.section}>
			<h2>Темы</h2>

			{data.map((t: any) => {
				const pct = t.lessons_total > 0 ? Math.round((t.lessons_done / t.lessons_total) * 100) : 0

				const durationStatus = getDurationStatus(t.started_at, t.completed_at)

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
								<span className={styles.timeLabelStart}>Розпочав</span>
								<span className={styles.timeValueStart}>{formatDateTime(t.started_at)}</span>
							</div>

							<div className={styles.timeItem}>
								<span className={styles.timeLabelEnd}>Закінчив</span>
								<span
									className={`${styles.timeValueEnd} ${
										durationStatus === 'danger'
											? styles.red
											: durationStatus === 'success'
												? styles.green
												: ''
									}`}
								>
									{formatDateTime(t.completed_at)}
								</span>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
