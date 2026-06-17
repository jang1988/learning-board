import styles from './LessonProgress.module.css'

export default function LessonProgress({ data }: any) {
	return (
		<div className={styles.section}>
			<h2>Уроки</h2>

			{data.map((l: any) => (
				<div
					key={l.id}
					className={styles.item}
				>
					<div className={styles.row}>
						<div className={styles.title}>
							{l.lesson?.title || l.lesson_id}
						</div>

						<div
							className={`${styles.status} ${
								l.status === 'completed'
									? styles.success
									: styles.pending
							}`}
						>
							{l.status === 'completed'
								? 'Переглянуто'
								: 'Не завершено'}
						</div>
					</div>

					{/* <div className={styles.metaRow}>
						<div className={styles.metaItem}>
							<span className={styles.metaLabel}>
								Статус
							</span>

							<span className={styles.metaValue}>
								{l.status}
							</span>
						</div>

						<div className={styles.metaItem}>
							<span className={styles.metaLabel}>
								Час
							</span>

							<span className={styles.metaValue}>
								{Math.round(
									(l.watch_time_sec || 0) /
										60
								)}{' '}
								хв
							</span>
						</div>
					</div> */}
				</div>
			))}
		</div>
	)
}