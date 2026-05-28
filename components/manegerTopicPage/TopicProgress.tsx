import styles from './TopicProgress.module.css'

export function TopicProgress({
	lessonsDone,
	lessonsTotal,
	progressPct
}: {
	lessonsDone: number
	lessonsTotal: number
	progressPct: number
}) {
	return (
		<div className={styles.progressWrap}>
			<div className={styles.progressInfo}>
				<span>
					{lessonsDone} / {lessonsTotal} уроків
				</span>
				<span>{progressPct}%</span>
			</div>
			<div className="progress-bar">
				<div
					className={`progress-bar__fill ${progressPct === 100 ? 'progress-bar__fill--success' : ''}`}
					style={{ width: `${progressPct}%` }}
				/>
			</div>
		</div>
	)
}
