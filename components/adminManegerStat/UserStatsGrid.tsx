import styles from './UserStatsGrid.module.css'

export default function UserStatsGrid({
	topicsTotal,
	completedTopics,
	lessonsTotal,
	completedLessons,
	avgScore
}: any) {
	const topicPct =
		topicsTotal > 0 ? Math.round((completedTopics / topicsTotal) * 100) : 0

	const lessonPct =
		lessonsTotal > 0
			? Math.round((completedLessons / lessonsTotal) * 100)
			: 0

	return (
		<div className={styles.statsGrid}>
			<div className={styles.card}>
				<div className={styles.value}>{topicPct}%</div>
				<div className={styles.label}>Прогресс тем</div>
			</div>

			<div className={styles.card}>
				<div className={styles.value}>
					{completedTopics}/{topicsTotal}
				</div>
				<div className={styles.label}>Темы</div>
			</div>

			<div className={styles.card}>
				<div className={styles.value}>
					{completedLessons}/{lessonsTotal}
				</div>
				<div className={styles.label}>Уроки</div>
			</div>

			<div className={styles.card}>
				<div className={styles.value}>{avgScore}%</div>
				<div className={styles.label}>Средний балл</div>
			</div>
		</div>
	)
}