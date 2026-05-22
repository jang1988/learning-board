'use client'

import Link from 'next/link'
import { useState } from 'react'
import LessonList from './LessonList'
import styles from './topic.module.css'

interface TopicPageClientProps {
	topic: any
	lessons: any[]
	quiz: any | null
	quizResult: any | null
	initialCompletedIds: string[]
	userId: string
	lessonsTotal: number
	allLessonsDone: boolean
	isPending: boolean
	isReviewed: boolean
	hasPassed: boolean
	attemptsLeft: number
}

export default function TopicPageClient({
	topic,
	lessons,
	quiz,
	quizResult,
	initialCompletedIds,
	userId,
	lessonsTotal,
	allLessonsDone,
	isPending,
	isReviewed,
	hasPassed,
	attemptsLeft
}: TopicPageClientProps) {
	// Состояние завершённых уроков, синхронизированное с LessonList
	const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(initialCompletedIds))

	const [quizState, setQuizState] = useState(() => ({
		quizResult,
		isPending,
		isReviewed,
		hasPassed,
		attemptsLeft
	}))

	// Функция для обновления прогресса (будет передана в LessonList)
	const updateCompleted = (lessonId: string, isNowCompleted: boolean) => {
		setCompletedIds(prev => {
			const next = new Set(prev)
			if (isNowCompleted) {
				next.add(lessonId)
			} else {
				next.delete(lessonId)
			}
			return next
		})
	}

	const lessonsDone = completedIds.size
	const progressPct = lessonsTotal ? Math.round((lessonsDone / lessonsTotal) * 100) : 0
	const allLessonsDoneLive = lessonsDone === lessonsTotal

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

			{/* Живой прогресс‑бар */}
			<div
				className={styles.progressWrap}
				style={{ marginBottom: 16 }}
			>
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

			<div className={styles.grid}>
				<div className={styles.lessons}>
					<h2 className={styles.sectionTitle}>Уроки</h2>
					<LessonList
						lessons={lessons}
						userId={userId}
						topicId={topic.id}
						initialCompletedIds={initialCompletedIds}
						onProgressUpdate={updateCompleted} // передаём callback
					/>
				</div>

				{quiz && (
					<div className={styles.quizCard}>
						<div className={styles.quizIcon}>📝</div>

						<h3 className={styles.quizTitle}>{quiz.title}</h3>

						<div className={styles.quizMeta}>
							<span>{(quiz.questions as any)?.[0]?.count ?? 0} питань</span>
							<span>Прохідний бал: {quiz.passing_score}%</span>
						</div>

						{/* PENDING */}
						{quizState.isPending && (
							<div className={styles.quizPending}>
								<div className={styles.quizPendingIcon}>
									<div className={styles.pendingSpinner}></div>
								</div>

								<div className={styles.quizPendingText}>Очікує перевірки</div>

								<div className={styles.quizPendingSub}>
									Результат буде доступний після перевірки адміністратором
								</div>
							</div>
						)}

						{/* RESULT */}
						{quizState.isReviewed && quizState.quizResult && (
							<div
								className={`${styles.quizResult} ${
									quizState.hasPassed ? styles.passed : styles.failed
								}`}
							>
								<span>{quizState.quizResult.percent}%</span>
								<span>{quizState.hasPassed ? '✓ Пройдено' : '✕ Не пройдено'}</span>
								<span>Спроба #{quizState.quizResult.attempt_num}</span>
							</div>
						)}

						{/* LOCK */}
						{!allLessonsDoneLive && !quizState.quizResult && (
							<div className={styles.quizLocked}>🔒 Завершіть всі уроки</div>
						)}

						{/* BUTTON */}
						{!quizState.isPending &&
							!quizState.hasPassed &&
							(allLessonsDoneLive || quizState.quizResult) &&
							quizState.attemptsLeft > 0 && (
								<Link
									href={`/manager/topics/${topic.id}/quiz`}
									className={styles.quizBtn}
								>
									{quizState.quizResult
										? `Спробувати знову (залишилося ${quizState.attemptsLeft})`
										: 'Пройти тест'}
								</Link>
							)}
					</div>
				)}
			</div>
		</div>
	)
}
