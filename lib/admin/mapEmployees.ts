export function mapEmployees(employees: any[], topicsTotal: number) {
	return employees.map(emp => {
		const done =
			emp.topic_progress?.filter(
				(p: any) => p.status === 'completed'
			).length ?? 0

		const pct =
			topicsTotal > 0
				? Math.round((done / topicsTotal) * 100)
				: 0

		const checkedResults =
			emp.quiz_results?.filter(
				(r: any) => r.status !== 'pending'
			) ?? []

		const avgScore =
			checkedResults.length > 0
				? Math.round(
						checkedResults.reduce(
							(sum: number, r: any) => sum + r.percent,
							0
						) / checkedResults.length
				  )
				: null

		return {
			...emp,
			done,
			total: topicsTotal,
			pct,
			avgScore
		}
	})
}