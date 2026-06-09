'use client'

import Link from 'next/link'

import LessonList from './LessonList'

import { useQuizAccess } from '@/hooks/useQuizAccess'
import { useTopicProgress } from '@/hooks/useTopicProgress'

import { QuizCard } from '@/components/managerTopicPage/QuizCard'
import { TopicHero } from '@/components/managerTopicPage/TopicHero'
import { TopicProgress } from '@/components/managerTopicPage/TopicProgress'
import styles from './topic.module.css'

export default function TopicPageClient({
	topic,
	lessons,
	quiz,
	quizResult,
	initialCompletedIds,
	userId,
	lessonsTotal,
	isPending,
	isReviewed,
	hasPassed,
	attemptsLeft
}: any) {
	const progress = useTopicProgress({
		initialCompletedIds,
		lessonsTotal
	})

	const quizAccess = useQuizAccess({
		isPending,
		hasPassed,

		allLessonsDone: progress.allLessonsDone,

		attemptsLeft,
		quizResult
	})

	return (
		<div className={styles.page}>
			<div className={styles.breadcrumb}>
				<Link
					href="/manager/topics"
					className={styles.back}
				>
					← Всі теми
				</Link>
			</div>

			<TopicHero
				topic={topic}
				lessonsDone={progress.lessonsDone}
				lessonsTotal={lessonsTotal}
				quiz={quiz}
				quizResult={quizResult}
				isPending={isPending}
				hasPassed={hasPassed}
			/>

			<TopicProgress
				lessonsDone={progress.lessonsDone}
				lessonsTotal={lessonsTotal}
				progressPct={progress.progressPct}
			/>

			<div className={styles.grid}>
				<div className={styles.lessons}>
					<h2 className={styles.sectionTitle}>Уроки</h2>

					<LessonList
						lessons={lessons}
						userId={userId}
						topicId={topic.id}
						initialCompletedIds={initialCompletedIds}
						onProgressUpdate={progress.updateCompleted}
					/>
				</div>

				{quiz && (
					<QuizCard
						topicId={topic.id}
						quiz={quiz}
						quizResult={quizResult}
						isPending={isPending}
						isReviewed={isReviewed}
						hasPassed={hasPassed}
						attemptsLeft={attemptsLeft}
						canStartQuiz={quizAccess.canStartQuiz}
						isLocked={quizAccess.isLocked}
					/>
				)}
			</div>
		</div>
	)
}
