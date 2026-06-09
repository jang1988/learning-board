import LessonProgress from '@/components/adminManegerStat/LessonProgress'
import QuizHistory from '@/components/adminManegerStat/QuizHistory'
import TopicProgress from '@/components/adminManegerStat/TopicProgress'
import UserHeader from '@/components/adminManegerStat/UserHeader'
import UserStatsGrid from '@/components/adminManegerStat/UserStatsGrid'
import { calculateUserStats } from '@/lib/admin/calculateUserStats'
import { getGlobalStats } from '@/api/getGlobalStats'
import { getUserDetails } from '@/api/getUserDetails'
import styles from './user.module.css'

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params

	const profile = await getUserDetails(id)

	if (!profile) {
		return <div>Not found</div>
	}

	const { topicsTotal, lessonsTotal } = await getGlobalStats()

	const { completedTopics, completedLessons, avgScore } = calculateUserStats(profile)

	return (
		<div className={styles.page}>
			<UserHeader employee={profile} />

			<UserStatsGrid
				topicsTotal={topicsTotal}
				completedTopics={completedTopics}
				lessonsTotal={lessonsTotal}
				completedLessons={completedLessons}
				avgScore={avgScore}
			/>

			<div className={styles.grid}>
				<TopicProgress data={profile.topic_progress || []} />
				<LessonProgress data={profile.lesson_progress || []} />
				<QuizHistory data={profile.quiz_results || []} />
			</div>
		</div>
	)
}
