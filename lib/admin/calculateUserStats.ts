export function calculateUserStats(profile: any) {
	const completedTopics =
		profile.topic_progress?.filter(
			(t: any) => t.status === 'completed'
		).length || 0

	const completedLessons =
		profile.lesson_progress?.filter(
			(l: any) => l.status === 'completed'
		).length || 0

	const finishedResults =
		profile.quiz_results?.filter(
			(r: any) => r.status !== 'pending'
		) || []

	const avgScore = finishedResults.length
		? Math.round(
				finishedResults.reduce(
					(sum: number, r: any) => sum + (r.percent || 0),
					0
				) / finishedResults.length
		  )
		: 0

	return {
		completedTopics,
		completedLessons,
		avgScore
	}
}