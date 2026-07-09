import styles from './QuizHistory.module.css'

function formatDate(date: string | null | undefined) {
	if (!date) return '-'

	return new Date(date).toLocaleDateString('uk-UA', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

function formatDuration(sec: number | null | undefined) {
	if (!sec || sec <= 0) return '-'

	const minutes = Math.floor(sec / 60)
	const seconds = sec % 60

	return `${minutes} хв${seconds ? ` ${seconds}с` : ''}`
}

const STATUS_LABELS: Record<string, string> = {
	pending: 'На перевірці',
	checked: 'Перевірено'
}

export default function QuizHistory({ data }: any) {
	const sorted = [...data].sort(
		(a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
	)

	const passedCount = data.filter((q: any) => q.passed).length
	const avgPercent =
		data.length > 0
			? Math.round(data.reduce((sum: number, q: any) => sum + (q.percent ?? 0), 0) / data.length)
			: null

	return (
		<div className={styles.section}>
			<div className={styles.header}>
				<h2>Історія тестів</h2>
				<span>
					{data.length} спроб · {passedCount} здано
					{avgPercent !== null ? ` · сер. ${avgPercent}%` : ''}
				</span>
			</div>

			<table className={styles.table}>
				<thead>
					<tr>
						<th>Тема</th>
						<th>Спроба</th>
						<th>Результат</th>
						<th>Статус</th>
						<th>Час</th>
						<th>Дата</th>
					</tr>
				</thead>

				<tbody>
					{sorted.map((q: any) => (
						<tr key={q.id}>
							<td>{q.quiz?.topic?.title ?? '-'}</td>

							<td>
								<div className={styles.attempt}>#{q.attempt_num}</div>
							</td>

							<td>
								<span className={styles.percent}>
									{q.score ?? '-'}/{q.max_score} ({q.percent ?? '-'}%)
								</span>
							</td>

							<td>
								{q.status === 'pending' ? (
									<span className={`${styles.badge} ${styles.pending}`}>
										{STATUS_LABELS.pending}
									</span>
								) : (
									<span className={`${styles.badge} ${q.passed ? styles.success : styles.failed}`}>
										{q.passed ? 'Здав' : 'Не здав'}
									</span>
								)}
							</td>

							<td>{formatDuration(q.time_spent_sec)}</td>

							<td>{formatDate(q.submitted_at)}</td>
						</tr>
					))}
				</tbody>
			</table>

			{data.length === 0 && <div className={styles.empty}>Немає спроб проходження тестів</div>}
		</div>
	)
}
