import Link from 'next/link'

import { NotebookPen, Video } from 'lucide-react'
import styles from './TopicCard.module.css'

type Props = {
	topic: any
	index: number
}

export function TopicCard({ topic, index }: Props) {
	return (
		<Link
			href={`/manager/topics/${topic.id}`}
			className={styles.card}
		>
			<div className={styles.cardTop}>
				<div className={styles.num}>#{index + 1}</div>

				<StatusBadge status={topic.status} />
			</div>

			<h2 className={styles.cardTitle}>{topic.title}</h2>

			{topic.description && <p className={styles.cardDesc}>{topic.description}</p>}

			<div className={styles.cardMeta}>
				<span>
					<Video /> {topic.lessonsTotal} уроків
				</span>

				{topic.hasQuiz && (
					<span>
						<NotebookPen size={18} /> Тест
					</span>
				)}

				{topic.is_required && <span className={styles.required}>Обов'язкова</span>}
			</div>

			{topic.status !== 'not_started' && (
				<Progress
					done={topic.lessonsDone}
					total={topic.lessonsTotal}
					percent={topic.pct}
					completed={topic.status === 'completed'}
				/>
			)}
		</Link>
	)
}

function StatusBadge({ status }: { status: string }) {
	const map = {
		completed: {
			text: '✓ Завершено',
			className: 'badge--green'
		},
		in_progress: {
			text: 'У процесі',
			className: 'badge--blue'
		},
		not_started: {
			text: 'Не розпочато',
			className: 'badge--gray'
		}
	}

	const item = map[status as keyof typeof map]

	return <span className={`badge ${item.className}`}>{item.text}</span>
}

function Progress({
	done,
	total,
	percent,
	completed
}: {
	done: number
	total: number
	percent: number
	completed: boolean
}) {
	return (
		<div className={styles.progressWrap}>
			<div className={styles.progressTop}>
				<span>
					{done} / {total} уроків
				</span>

				<span>{percent}%</span>
			</div>

			<div className="progress-bar">
				<div
					className={`progress-bar__fill ${completed ? 'progress-bar__fill--success' : ''}`}
					style={{
						width: `${percent}%`
					}}
				/>
			</div>
		</div>
	)
}
