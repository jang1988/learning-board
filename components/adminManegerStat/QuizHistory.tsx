import styles from '@/app/admin/users/[id]/user.module.css'

export default function QuizHistory({ data }: any) {
	return (
		<div className={styles.section}>
			<h2>Тесты</h2>

			<table className={styles.table}>
				<thead>
					<tr>
						<th>Попытка</th>
						<th>Результат</th>
						<th>Статус</th>
						<th>Время</th>
					</tr>
				</thead>

				<tbody>
					{data.map((q: any) => (
						<tr key={q.id}>
							<td>{q.attempt_num}</td>
							<td>{q.percent}%</td>
							<td>{q.passed ? 'passed' : 'failed'}</td>
							<td>{Math.round((q.time_spent_sec || 0) / 60)} мин</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}