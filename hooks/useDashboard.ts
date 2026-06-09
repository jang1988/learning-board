import { getDashboardData } from '../api/getDashboardData'
import { enrichTopicsWithProgress } from '@/lib/manager/calcTopicProgress'

export async function useDashboard(userId: string) {
	const { profile, topics, recentResults } =
		await getDashboardData(userId)

	const enrichedTopics = enrichTopicsWithProgress(
		topics ?? [],
		userId
	)

	const total = enrichedTopics.length
	const completed = enrichedTopics.filter(
		t => t.status === 'completed'
	).length

	const inProgress = enrichedTopics.filter(
		t => t.status === 'in_progress'
	).length

	return {
		profile,
		recentResults,
		topics: enrichedTopics,
		stats: {
			total,
			completed,
			inProgress
		}
	}
}