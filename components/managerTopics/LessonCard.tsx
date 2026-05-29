'use client'

import styles from './LessonCard.module.css'
import VideoPlayer from '@/components/video/VideoPlayer'

type Material = {
	id: string
	title: string
	url: string
	type: string
}

type Lesson = {
	id: string
	title: string
	description?: string
	video_url: string
	order_index: number
	materials?: Material[]
}

type Props = {
	lesson: Lesson
	index: number

	isOpen: boolean
	isCompleted: boolean

	onToggle: () => void
	onComplete: () => void
}

export function LessonCard({
	lesson,
	index,

	isOpen,
	isCompleted,

	onToggle,
	onComplete
}: Props) {
	return (
		<div className={`${styles.lessonCard} ${isCompleted ? styles.lessonDone : ''}`}>
			<button
				className={styles.lessonHeader}
				onClick={onToggle}
			>
				<div className={styles.lessonLeft}>
					<div className={`${styles.lessonNum} ${isCompleted ? styles.lessonNumDone : ''}`}>
						{isCompleted ? '✓' : index + 1}
					</div>

					<div>
						<div className={styles.lessonTitle}>{lesson.title}</div>

						{lesson.description && !isOpen && (
							<div className={styles.lessonSub}>{lesson.description}</div>
						)}
					</div>
				</div>

				<div className={styles.lessonRight}>
					{isCompleted && <span className="badge badge--green">Переглянуто</span>}

					<span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
				</div>
			</button>

			{isOpen && (
				<div className={styles.lessonBody}>
					{lesson.description && <p className={styles.lessonDesc}>{lesson.description}</p>}

					<VideoPlayer
						url={lesson.video_url}
						title={lesson.title}
						onComplete={isCompleted ? undefined : onComplete}
					/>

				{lesson.materials && lesson.materials.length > 0 && (
						<div className={styles.materials}>
							<div className={styles.materialsTitle}>📎 Доп. матеріали</div>

							<div className={styles.materialsList}>
								{lesson.materials.map(m => (
									<a
										key={m.id}
										href={m.url}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.material}
									>
										<span className={styles.materialIcon}>{getIcon(m.type)}</span>

										{m.title}
									</a>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

function getIcon(type: string) {
	switch (type) {
		case 'pdf':
			return '📄'
		case 'image':
			return '🖼'
		default:
			return '🔗'
	}
}
