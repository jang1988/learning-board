import styles from './QuizHistory.module.css'

export default function QuizHistory({ data }: any) {
	return (
		<div className={styles.section}>
			<div className={styles.header}>
				<h2>История тестов</h2>
				<span>{data.length} спроб</span>
			</div>

			<table className={styles.table}>
				<thead>
					<tr>
						<th>Спроба</th>
						<th>Результат</th>
						<th>Статус</th>
						<th>Час</th>
					</tr>
				</thead>

				<tbody>
					{data.map((q: any) => (
						<tr key={q.id}>
							<td>
								<div className={styles.attempt}>
									#{q.attempt_num}
								</div>
							</td>

							<td>
								<span className={styles.percent}>
									{q.percent}%
								</span>
							</td>

							<td>
								<span
									className={`${styles.badge} ${
										q.passed
											? styles.success
											: styles.failed
									}`}
								>
									{q.passed ? 'Здав' : 'Не здав'}
								</span>
							</td>

							<td>
								{Math.round(
									(q.time_spent_sec || 0) / 60
								)} хв
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}