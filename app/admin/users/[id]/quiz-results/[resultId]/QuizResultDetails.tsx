import styles from './QuizResultDetails.module.css'

type Answer = {
	id: string
	text: string
	is_correct: boolean
	order_index?: number
}

type Question = {
	id: string
	text: string
	type?: string
	order_index?: number
	answers?: Answer[]
}

type UserAnswer = {
	id: string
	question_id: string
	selected_answer_ids: string[] // было: answer_id: string | null
	text_answer: string | null
	question: Question
}

type QuizResult = {
	id: string
	attempt_num: number
	score: number | null
	max_score: number | null
	percent: number | null
	passed: boolean | null
	status: string
	time_spent_sec: number | null
	submitted_at: string | null
	user_answers: UserAnswer[]
}

type Props = {
	result: QuizResult
}

function formatDate(date: string | null) {
	if (!date) return '-'

	return new Date(date).toLocaleDateString('uk-UA', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

function formatDuration(seconds: number | null) {
	if (!seconds || seconds <= 0) return '-'

	const minutes = Math.floor(seconds / 60)
	const sec = seconds % 60

	if (minutes === 0) {
		return `${sec}с`
	}

	return `${minutes} хв ${sec}с`
}

/**
 * Определяет результат ответа пользователя
 */
function getQuestionResult(userAnswer: UserAnswer) {
	if (userAnswer.text_answer !== null && userAnswer.text_answer.trim() !== '') {
		return 'text'
	}

	if (userAnswer.selected_answer_ids.length === 0) {
		return 'empty'
	}

	const correctIds = new Set(
		(userAnswer.question.answers ?? []).filter(answer => answer.is_correct).map(answer => answer.id)
	)

	const selectedIds = new Set(userAnswer.selected_answer_ids)

	const isFullyCorrect =
		selectedIds.size === correctIds.size && [...selectedIds].every(id => correctIds.has(id))

	return isFullyCorrect ? 'correct' : 'wrong'
}

export default function QuizResultDetails({ result }: Props) {
	const sortedAnswers = [...result.user_answers].sort(
		(a, b) => (a.question.order_index ?? 0) - (b.question.order_index ?? 0)
	)

	const correctCount = sortedAnswers.filter(
		answer => getQuestionResult(answer) === 'correct'
	).length

	const wrongCount = sortedAnswers.filter(answer => getQuestionResult(answer) === 'wrong').length

	const emptyCount = sortedAnswers.filter(answer => getQuestionResult(answer) === 'empty').length

	return (
		<div className={styles.wrapper}>
			{/* HEADER */}
			<div className={styles.header}>
				<div>
					<div className={styles.eyebrow}>Результат тестування</div>

					<h1>Перевірка відповідей</h1>

					<p>
						Спроба №{result.attempt_num}
						{' · '}
						{formatDate(result.submitted_at)}
					</p>
				</div>

				<div
					className={`${styles.resultBadge} ${
						result.passed ? styles.resultPassed : styles.resultFailed
					}`}
				>
					{result.passed ? 'Здав' : 'Не здав'}
				</div>
			</div>

			{/* SUMMARY */}
			<div className={styles.summary}>
				<div className={styles.scoreCard}>
					<span className={styles.summaryLabel}>Результат</span>

					<strong>
						{result.score ?? 0}
						<small> / {result.max_score ?? 0}</small>
					</strong>

					<span className={styles.percent}>{result.percent ?? 0}%</span>
				</div>

				<div className={styles.stat}>
					<span>Правильних</span>
					<strong className={styles.correctText}>{correctCount}</strong>
				</div>

				<div className={styles.stat}>
					<span>Неправильних</span>
					<strong className={styles.wrongText}>{wrongCount}</strong>
				</div>

				<div className={styles.stat}>
					<span>Без відповіді</span>
					<strong className={styles.emptyText}>{emptyCount}</strong>
				</div>

				<div className={styles.stat}>
					<span>Час проходження</span>
					<strong>{formatDuration(result.time_spent_sec)}</strong>
				</div>
			</div>

			{/* QUESTIONS */}
			<div className={styles.questions}>
				{sortedAnswers.map((userAnswer, index) => {
					const questionResult = getQuestionResult(userAnswer)

					/**
					 * ВАЖНО:
					 * Это конкретный ответ, который сохранился
					 * в quiz_user_answers.answer_id
					 */
					const selectedAnswers = (userAnswer.question.answers ?? []).filter(answer =>
						userAnswer.selected_answer_ids.includes(answer.id)
					)

					const sortedOptions = [...(userAnswer.question.answers ?? [])].sort(
						(a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
					)

					return (
						<article
							key={userAnswer.id}
							className={`${styles.questionCard} ${
								questionResult === 'correct'
									? styles.questionCorrect
									: questionResult === 'wrong'
										? styles.questionWrong
										: questionResult === 'empty'
											? styles.questionEmpty
											: ''
							}`}
						>
							{/* QUESTION HEADER */}
							<div className={styles.questionHeader}>
								<div className={styles.questionNumber}>{String(index + 1).padStart(2, '0')}</div>

								<div className={styles.questionInfo}>
									<span>Питання {index + 1}</span>

									<h2>{userAnswer.question.text}</h2>
								</div>

								<QuestionStatus result={questionResult} />
							</div>

							{/* TEXT ANSWER */}
							{userAnswer.text_answer !== null ? (
								<div className={styles.textAnswerBlock}>
									<div className={styles.answerLabel}>Відповідь співробітника</div>

									<div className={styles.textAnswer}>
										{userAnswer.text_answer || 'Відповідь не надана'}
									</div>
								</div>
							) : (
								/* OPTIONS */
								<div className={styles.options}>
									{sortedOptions.map((answer, answerIndex) => {
										/**
										 * ГЛАВНАЯ ПРОВЕРКА:
										 *
										 * answer.id === userAnswer.answer_id
										 *
										 * Значит именно этот ответ
										 * выбрал пользователь.
										 */
										const isSelected = userAnswer.selected_answer_ids.includes(answer.id)

										const isCorrect = answer.is_correct

										let optionClass = styles.option

										/*
										 * Правильный ответ
										 */
										if (isCorrect) {
											optionClass += ` ${styles.optionCorrect}`
										}

										/*
										 * Пользователь выбрал неправильный
										 */
										if (isSelected && !isCorrect) {
											optionClass += ` ${styles.optionWrong}`
										}

										/*
										 * Пользователь выбрал правильный
										 */
										if (isSelected && isCorrect) {
											optionClass += ` ${styles.optionSelectedCorrect}`
										}

										return (
											<div
												key={answer.id}
												className={optionClass}
											>
												<div className={styles.optionIcon}>
													{isSelected ? '✓' : String.fromCharCode(65 + answerIndex)}
												</div>

												<div className={styles.optionContent}>
													<span>{answer.text}</span>

													<div className={styles.optionLabels}>
														{/* ПОЛЬЗОВАТЕЛЬ ВЫБРАЛ */}
														{isSelected && (
															<span className={styles.selectedLabel}>Відповідь</span>
														)}

														{/* ПРАВИЛЬНЫЙ */}
														{isCorrect && (
															<span className={styles.correctLabel}>Правильна відповідь</span>
														)}

														{/* ВЫБРАН, НО НЕПРАВИЛЬНЫЙ */}
														{isSelected && !isCorrect && (
															<span className={styles.wrongLabel}>Неправильна відповідь</span>
														)}
													</div>
												</div>
											</div>
										)
									})}
								</div>
							)}

							{/* EMPTY */}
							{questionResult === 'empty' && (
								<div className={styles.emptyAnswer}>
									<span>!</span>

									<div>
										<strong>Відповідь не вибрана</strong>

										<p>Співробітник не відповів на це питання.</p>
									</div>
								</div>
							)}

							{/* TEXT */}
							{questionResult === 'text' && (
								<div className={styles.reviewNotice}>
									<span>i</span>

									<div>
										<strong>Текстова відповідь</strong>

										<p>Відповідь потребує ручної перевірки.</p>
									</div>
								</div>
							)}

							{/* CORRECT */}
							{questionResult === 'correct' && (
								<div className={styles.feedbackCorrect}>
									<span>✓</span>

									<strong>Відповідь правильна</strong>
								</div>
							)}

							{/* WRONG */}
							{questionResult === 'wrong' && (
								<div className={styles.feedbackWrong}>
									<span>×</span>

									<div>
										<strong>Відповідь неправильна</strong>

										{selectedAnswers.length > 0 && (
											<p>
												Обрано: <b>{selectedAnswers.map(a => a.text).join(', ')}</b>
											</p>
										)}

										<p>Правильна відповідь виділена вище.</p>
									</div>
								</div>
							)}
						</article>
					)
				})}
			</div>
		</div>
	)
}

function QuestionStatus({ result }: { result: string }) {
	if (result === 'correct') {
		return (
			<div className={`${styles.status} ${styles.statusCorrect}`}>
				<span>✓</span>
				Правильно
			</div>
		)
	}

	if (result === 'wrong') {
		return (
			<div className={`${styles.status} ${styles.statusWrong}`}>
				<span>×</span>
				Неправильно
			</div>
		)
	}

	if (result === 'empty') {
		return (
			<div className={`${styles.status} ${styles.statusEmpty}`}>
				<span>—</span>
				Без відповіді
			</div>
		)
	}

	return (
		<div className={`${styles.status} ${styles.statusPending}`}>
			<span>i</span>
			Перевірка
		</div>
	)
}
