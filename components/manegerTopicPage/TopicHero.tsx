import styles from './TopicHero.module.css'

export function TopicHero({
	topic,
	lessonsDone,
	lessonsTotal,
	quiz,
	quizResult,
	isPending,
	hasPassed
}: any) {
	return (
		<div className={styles.header}>
				<div>
					<h1 className={styles.title}>{topic.title}</h1>
					{topic.description && <p className={styles.desc}>{topic.description}</p>}
				</div>
				<div className={styles.headerStats}>
					<div className={styles.stat}>
						<span className={styles.statNum}>
							{lessonsDone}/{lessonsTotal}
						</span>
						<span className={styles.statLabel}>уроків</span>
					</div>
					{quiz && (
						<div className={styles.stat}>
							<span className={styles.statNum}>
								{isPending ? '⏳' : hasPassed ? '✓' : quizResult ? quizResult.percent + '%' : '—'}
							</span>
							<span className={styles.statLabel}>тест</span>
						</div>
					)}
				</div>
			</div>
	)
}