import { DashboardStats } from '@/components/managerDashboard/DashboardStats'
import { RecentQuizzes } from '@/components/managerDashboard/RecentQuizzes'
import { TopicsSection } from '@/components/managerDashboard/TopicsSection'
import { getDashboardViewModel } from '@/hooks/useDashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'

export default async function ManagerDashboard() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) redirect('/auth/login')

	const data = await getDashboardViewModel(user.id)
	const { profile, recentResults, topics: enrichedTopics, stats } = data
	const { total, completed } = stats

	

	return (
		<div className={styles.page}>
			<div className={styles.welcome}>
				<div>
					<h1 className={styles.welcomeTitle}>
						Ласкаво просимо, {profile?.full_name?.split(' ')[0]}
					</h1>
					<p className={styles.welcomeSub}>Продовжуйте навчання з того місця, де зупинилися</p>
				</div>
			</div>

			{/* STATS */}
			<DashboardStats stats={stats} />

			{/* PROGRESS BAR */}
			<div className={styles.progressSection}>
				<div className="progress-bar">
					<div
						className="progress-bar__fill progress-bar__fill--success"
						style={{
							width: `${total > 0 ? (completed / total) * 100 : 0}%`
						}}
					/>
				</div>
			</div>

			<div className={styles.grid}>
				{/* TOPICS */}
				<TopicsSection enrichedTopics={enrichedTopics}  />

				{/* QUIZZES */}
				<RecentQuizzes recentResults={recentResults} />
			</div>
		</div>
	)
}
