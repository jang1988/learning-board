import styles from '@/app/admin/users/[id]/user.module.css'

export default function LessonProgress({ data }: any) {
	return (
		<div className={styles.section}>
			<h2>Уроки</h2>

			{data.map((l: any) => (
				<div key={l.id} className={styles.lesson}>
					<div>{l.lesson?.title || l.lesson_id}</div>

					<div className={styles.meta}>
						<span>{l.status}</span>
						<span>{Math.round((l.watch_time_sec || 0) / 60)} мин</span>
					</div>
				</div>
			))}
		</div>
	)
}