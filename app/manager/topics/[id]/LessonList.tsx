'use client'

import { useState } from 'react'

import { LessonCard } from '@/components/managerTopics/LessonCard'

import { useLessonProgress } from '@/hooks/useLessonProgress'

import styles from './topic.module.css'

export default function LessonList({
	lessons,
	userId,
	topicId,
	initialCompletedIds,
	onProgressUpdate
}: any) {
	const [expanded, setExpanded] = useState<string | null>(null)

	const progress = useLessonProgress({
		initialCompletedIds,

		lessonsTotal: lessons.length,

		userId,
		topicId,

		onProgressUpdate
	})

	return (
		<div className={styles.lessonList}>
			{lessons.map((lesson: any, index: number) => (
				<LessonCard
					key={lesson.id}
					lesson={lesson}
					index={index}
					isOpen={expanded === lesson.id}
					isCompleted={progress.isCompleted(lesson.id)}
					onToggle={() => setExpanded(expanded === lesson.id ? null : lesson.id)}
					onComplete={() => progress.markCompleted(lesson.id)}
				/>
			))}
		</div>
	)
}