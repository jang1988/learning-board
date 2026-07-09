import styles from './LessonProgress.module.css'

export default function LessonProgress({ data }: any) {
	return (
		<div className={styles.section}>
			<h2>Останні переглянуті уроки</h2>

			{data.slice(-8).reverse().map((l: any) => (
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

				</div>
			))}
		</div>
	)
}