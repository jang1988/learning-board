import Link from 'next/link'

import styles from './QuizCard.module.css'

type Props = {
	topicId: string

	quiz: any

	quizResult: any | null

	isPending: boolean
	isReviewed: boolean
	hasPassed: boolean

	attemptsLeft: number

	canStartQuiz: boolean
	isLocked: boolean
}

export function QuizCard({
	topicId,
	quiz,
	quizResult,

	isPending,
	isReviewed,
	hasPassed,

	attemptsLeft,

	canStartQuiz,
	isLocked
}: Props) {
	const questionsCount = quiz.questions?.[0]?.count ?? 0

	return (
		<div className={styles.quizCard}>
			<div className={styles.quizIcon}>📝</div>

			<h3 className={styles.quizTitle}>{quiz.title}</h3>

			<div className={styles.quizMeta}>
				<span>{questionsCount} питань</span>

				<span>Прохідний бал: {quiz.passing_score}%</span>
			</div>

			{/* Pending */}

			{isPending && (
				<div className={styles.quizPending}>
					<div className={styles.quizPendingIcon}>
						<div className={styles.pendingSpinner} />
					</div>

					<div className={styles.quizPendingText}>Очікує перевірки</div>

					<div className={styles.quizPendingSub}>
						Результат буде доступний після перевірки адміністратором
					</div>
				</div>
			)}

			{/* Result */}

			{isReviewed && quizResult && (
				<div className={`${styles.quizResult} ${hasPassed ? styles.passed : styles.failed}`}>
					<span>{quizResult.percent}%</span>

					<span>{hasPassed ? '✓ Пройдено' : '✕ Не пройдено'}</span>

					<span>Спроба #{quizResult.attempt_num}</span>
				</div>
			)}

			{/* Locked */}

			{isLocked && <div className={styles.quizLocked}>🔒 Завершіть всі уроки</div>}

			{/* Start Button */}

			{canStartQuiz && (
				<Link
					href={`/manager/topics/${topicId}/quiz`}
					className={styles.quizBtn}
				>
					{quizResult ? `Спробувати знову (залишилося ${attemptsLeft})` : 'Пройти тест'}
				</Link>
			)}
		</div>
	)
}
