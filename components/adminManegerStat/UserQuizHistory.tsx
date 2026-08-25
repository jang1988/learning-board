'use client'

import Link from 'next/link'
import styles from './UserQuizHistory.module.css'

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

type Props = {
	data: any[]
}

export default function UserQuizHistory({ data }: Props) {
	const sorted = [...data].sort(
		(a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
	)

	const passedCount = data.filter(q => q.passed).length

	const avgPercent =
		data.length > 0
			? Math.round(data.reduce((sum, q) => sum + (q.percent ?? 0), 0) / data.length)
			: null

	return (
		<section className={styles.section}>
			<div className={styles.header}>
				<div>
					<h2>Історія тестів</h2>

					<span className={styles.stats}>
						{data.length} спроб · {passedCount} здано
						{avgPercent !== null && ` · сер. ${avgPercent}%`}
					</span>
				</div>
			</div>

			{data.length === 0 ? (
				<div className={styles.empty}>Немає спроб проходження тестів</div>
			) : (
				<div className={styles.tableWrapper}>
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
							{sorted.map(result => (
								<tr key={result.id}>
									<td>
										<Link
											href={`/admin/users/${result.user_id}/quiz-results/${result.id}`}
											className={styles.link}
										>
											{result.quiz?.topic?.title ?? '-'}
										</Link>
									</td>

									<td>#{result.attempt_num}</td>

									<td>
										<span className={styles.percent}>
											{result.score ?? '-'}/{result.max_score} ({result.percent ?? '-'}%)
										</span>
									</td>

									<td>
										{result.status === 'pending' ? (
											<span className={`${styles.badge} ${styles.pending}`}>На перевірці</span>
										) : (
											<span
												className={`${styles.badge} ${
													result.passed ? styles.success : styles.failed
												}`}
											>
												{result.passed ? 'Здав' : 'Не здав'}
											</span>
										)}
									</td>

									<td>{formatDuration(result.time_spent_sec)}</td>

									<td>{formatDate(result.submitted_at)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	)
}
